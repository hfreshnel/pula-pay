import bcrypt from "bcrypt";
import cors from "cors";
import express, { NextFunction } from 'express';
import jwt from "jsonwebtoken";
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import { Prisma } from "@prisma/client";
import swaggerUi from 'swagger-ui-express';
import { v4 as uuidv4 } from 'uuid';
import YAML from "yamljs"
import { z } from 'zod';

import accountService from "./services/accountService.js";
import ledgerEntryService from "./services/ledgerEntryService.js";
import userService from "./services/userService.js";
import txService from "./services/txService.js";
import { getRequestToPayStatus, getCollectionToken, requestToPay, transfer, getDisbursementsToken, getTransfertStatus } from './momo.js';
import { EntryKind, TxStatus } from "@prisma/client";
import verifyAuth from "./middleware/verifyAuth.js";

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONT_URL }));
const port = process.env.PORT || 3000;

// Swagger setup
const swaggerDocument = YAML.load("./src/docs/swagger.yaml");

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' });
app.use(pinoHttp({ logger }));

// --- Routes---

//Health
app.get('/health', (_req, res) => res.json({ ok: true }));

//Create sandbox RequestToPay
app.post("/deposits", async (req, res) => {
    try {
        const schema = z.object({
            userId: z.string().uuid(),
            amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
            msisdn: z.string().min(5),
            currency: z.string().default('EUR')
        });
        const { userId, amount, msisdn, currency } = schema.parse(req.body);

        const idempotencyKey = req.header('x-idempotency-key') ?? uuidv4();

        const userAcc = await accountService.getOrCreateUserAccount(userId, currency, msisdn);
        await accountService.getOrCreateEscrowAccount(currency);

        const referenceId = await txService.createDeposit(idempotencyKey, currency, amount, userId, msisdn);

        const token = await getCollectionToken();

        await requestToPay({ token, referenceId, amount, currency, msisdn, externalId: `deposit-${referenceId}` })

        res.status(202).json({ txId: referenceId });
    } catch (err: any) {
        const txId = err?.txId || null;
        if (txId) {
            try {
                txService.updateTx(txId, TxStatus.FAILED)
            } catch {

            }
        }
        req.log.error({ err }, 'deposit error');
        res.status(400).json({ error: err.message ?? 'bad request' });
    }
});

app.post("/withdraw", async (req, res) => {
    try {
        const schema = z.object({
            userId: z.string().uuid(),
            amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
            msisdn: z.string().min(5),
            currency: z.string().default('EUR')
        });
        const { userId, amount, msisdn, currency } = schema.parse(req.body);

        const idempotencyKey = req.header('x-idempotency-key') ?? uuidv4();

        const userAcc = await accountService.getOrCreateUserAccount(userId, currency);
        await accountService.getOrCreateEscrowAccount(currency);

        const balance = await accountService.getAccountBalance(userAcc.id);
        const amountDecimal = new Prisma.Decimal(amount);

        if (balance.lessThan(amountDecimal)) {
            throw new Error('INSUFFICIENT_FUNDS');
        }

        const referenceId = await txService.createWithdraw(idempotencyKey, currency, amount, userId, msisdn);

        const token = await getDisbursementsToken();

        await transfer({ token, referenceId, amount, currency, msisdn, externalId: `withdraw-${referenceId}` });

        res.status(202).json({ txId: referenceId });
    } catch (err: any) {
        const txId = err?.txId || null;
        if (txId) {
            try {
                await txService.updateTx(txId, TxStatus.FAILED)
            } catch {

            }
        }
        req.log.error({ err }, 'withdraw error');
        res.status(400).json({ error: err.message ?? 'bad request' });
    }
});

function getProductAdapter(kind: EntryKind) {
    switch (kind) {
        case EntryKind.DEPOSIT:
            return { getStatus: getRequestToPayStatus, getToken: getCollectionToken };
        case EntryKind.WITHDRAWAL:
            return { getStatus: getTransfertStatus, getToken: getDisbursementsToken };
        default:
            throw new Error(`Unknown product: ${kind}`);
    }
}

//Poll tx status
app.get("/transactions/:txId", async (req, res) => {
    try {
        const txId = z.string().uuid().parse(req.params.txId);
        const tx = await txService.getTx(txId);
        if (!tx) return res.status(404).json({ error: 'not found' });

        if (tx.status === TxStatus.SUCCESS || tx.status === TxStatus.FAILED) {
            return res.json({ status: tx.status });
        }

        const { getStatus, getToken } = getProductAdapter(tx.kind);
        const token = await getToken();


        const statusResp = await getStatus({ token, referenceId: txId });
        const status = (statusResp.status ?? '').toUpperCase();

        if (status === 'SUCCESSFUL') {
            const currency = tx.currency;
            const userId = (tx.meta as any).userId as string;
            const amountStr = tx.amount as unknown as string;

            const [escrowAcc, userAcc] = await Promise.all([
                accountService.getOrCreateEscrowAccount(currency),
                accountService.getOrCreateUserAccount(userId, currency)
            ]);

            switch (tx.kind) {
                case EntryKind.DEPOSIT:
                    await txService.completeTransaction(txId, escrowAcc, userAcc, amountStr, currency);
                    break;
                case EntryKind.WITHDRAWAL:
                    await txService.completeTransaction(txId, userAcc, escrowAcc, amountStr, currency);
                    break;
                default:
                    throw new Error(`Unknown transaction kind: ${tx.kind}`);
            }
            return res.json({ status: 'SUCCESS' });
        }

        if (status === 'FAILED' || status === 'REJECTED' || status === 'TIMEOUT') {
            await txService.updateTx(txId, TxStatus.FAILED);
            return res.json({ status: 'FAILED' });
        }

        return res.json({ status: 'PENDING' });
    } catch (err: any) {
        req.log.error({ err, txId: req.params.txId }, 'Transaction status check error');
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid transaction ID' });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

app.get("/users/:userId/transactions", async (req, res) => {
    try {
        const schema = z.object({ userId: z.string().uuid() });
        const { userId } = schema.parse({ userId: req.params.userId  });

        const userAccounts = await accountService.getUserAccounts(userId);
        const accountIds = userAccounts.map(acc => acc.id);
        const ledgerEntries = await ledgerEntryService.getLedgerEntriesForAccount(accountIds);
        const txIds = ledgerEntries.map(le => le.txId);
        const txs = await txService.getTxs(txIds);
        res.json({ txs });
    } catch (err: any) {
        req.log.error({ err, userId: req.params.userId }, 'Get user transactions error');
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

app.get("/users/:userId/balance", async (req, res) => {
    try {
        logger.info("Called: /users/:userId/balance");
        const schema = z.object({ userId: z.string().uuid(), currency: z.string().default('EUR') });
        const { userId, currency } = schema.parse({ userId: req.params.userId, currency: req.query.currency ?? 'EUR' });

        const acc = await accountService.getUserAccount(userId, currency)
        if (!acc) return res.json({ currency, balance: '0.000000' });

        const balScaled = await accountService.getAccountBalance(acc.id);
        res.json({ currency, balance: balScaled.toString() });
    } catch (err: any) {
        res.status(400).json({ error: err.message ?? 'bad request' });
    }
});

app.post("/transfer", async (req, res) => {
    try {
        const schema = z.object({
            senderId: z.string().uuid(),
            receiverId: z.string().uuid(),
            amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
            currency: z.string().default("EUR")
        });

        const { senderId, receiverId, amount, currency } = schema.parse(req.body);
        const idempotencyKey = req.header("x-idempotency-key") ?? uuidv4();

        const tx = await txService.createTransfer({
            senderId,
            receiverId,
            amount,
            currency,
            idempotencyKey
        });

        res.status(202).json({ txId: tx.id });
    } catch (err: any) {
        req.log?.error?.({ err }, "transfer error");
        res.status(400).json({ error: err.message ?? "bad request" })
    }
});

app.get("/resolve-recipient", async (req, res) => {
    try {
        const schema = z.object({
            senderId: z.string().uuid(),
            phone: z.string().min(5)
        });
        const { senderId, phone } = schema.parse(req.query);

        const user = await userService.getUserByPhone(phone);

        if (!user) {
            return res.status(404).json({ error: "no user with this number" });
        }

        if (user.id === senderId) {
            return res.status(400).json({ error: "cannot send to yourself" })
        };

        res.json({
            userId: user.id
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid input" });
        }
        req.log?.error?.({ err }, "resolve-recipient error");
        res.status(500).json({ error: "internal error" });
    }
});

app.post("/auth/register", async (req, res) => {
    try {
        const schema = z.object({
            phone: z.string().regex(/^\+?\d{7,15}$/),
            password: z.string()
        })
        const { phone, password } = schema.parse(req.body);

        const hashed = await bcrypt.hash(password, 10);

        const user = await userService.createUser(phone, hashed);

        const otp = (process.env.NODE_ENV === 'production') ? "000000" : Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await userService.addOtp(phone, otp, otpExpiresAt);

        console.log(`OTP pour ${phone}: ${otp}`); //TO DO: send by sms

        res.status(202).json({ userId: user.id });

    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid input" });
        }
        req.log?.error?.({ err }, "register error");
        res.status(500).json({ error: "internal error" });
    }
});

app.post("/auth/verify", async (req, res) => {
    try {
        const schema = z.object({
            phone: z.string().regex(/^\+?\d{7,15}$/),
            otp: z.string().length(6)
        })
        const { phone, otp } = schema.parse(req.body);

        const user = await userService.getUserByPhone(phone);

        if (!user) throw new Error("Utilisateur inconnu");

        if (user.isVerified) return res.status(400).json({ error: "Déjà vérifié" });

        if (new Date() > user.otpExpiresAt!) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

            await userService.addOtp(phone, otp, otpExpiresAt);

            console.log(`OTP pour ${phone}: ${otp}`);

            return res.status(400).json({ error: "Code OTP expiré, un nouveau a été envoyé" });
        }
        if (user.otpCode !== otp) {
            throw new Error("Code OTP invalide ou expiré");
        }

        await userService.verifiedUser(phone);
        res.status(202).json({ verified: true, message: "Vérification réussie" });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid input" });
        }
        req.log?.error?.({ err }, "verification error");
        res.status(500).json({ error: "internal error" });
    }
});

app.post("/auth/login", async (req, res) => {
    try {
        const schema = z.object({
            phone: z.string().regex(/^\+?\d{7,15}$/),
            password: z.string()
        })

        const { phone, password } = schema.parse(req.body);

        const user = await userService.getUserByPhone(phone);

        if (!user) return res.status(401).json({ error: "Utilisateur inconnu" });

        if (!user.isVerified) return res.status(402).json({ error: "Utilisateur non vérifié" });

        if (!await bcrypt.compare(password, user.passwordHash!)) return res.status(403).json({ error: "Mauvais identifiants" });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "1d" });
        res.status(202).json({ token });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid input" });
        }
        req.log?.error?.({ err }, "verification error");
        res.status(500).json({ error: "internal error" });
    }
});

app.get("/me", verifyAuth, async (req, res) => {
    try {
        const userData = await userService.getUserById(req.user!.id);

        if (!userData) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
        return res.status(200).json({ userData });
        
    } catch (err) {
        req.log?.error?.({ err }, "verification error");
        res.status(500).json({ error: "internal error" });
    }
});


/*
app.post('/webhooks/momo', async (req, res) => {
    try {
        const payload = req.body ?? {};
        const provider = 'MTN';
        const eventId = (payload.eventId ?? payload.referenceId ?? uuidv4()).toString();

        await prisma.webhookEvent.create({
            data: { provider, eventId, signatureOk: true, payload }
        });

        const ref = payload.referenceId ?? payload['X-Reference-Id'];
        console.log(`ref: ${ref}`);
        const status = (payload.status ?? '').toUpperCase();
        if (ref && (status === 'SUCCESSFUL' || status === 'FAILED')) {
            const tx = await prisma.tx.findUnique({ where: { id: ref } });
            if (tx && tx.status === TxStatus.PENDING) {
                if (status === 'SUCCESSFUL') {
                    const currency = tx.currency;
                    const userId = (tx.meta as any).userId as string;
                    const amountStr = tx.amount as unknown as string;
                    const [escrowAcc, userAcc] = await Promise.all([
                        getOrCreateEscrowAccount(currency),
                        getOrCreateUserAccount(userId, currency)
                    ]);
                    await prisma.$transaction(async (trx) => {
                        await trx.tx.update({ where: { id: tx.id }, data: { status: TxStatus.SUCCESS } });
                        await trx.ledgerEntry.createMany({
                            data: [
                                { txId: tx.id, accountId: escrowAcc.id, debit: amountStr as any, credit: 0 as any, currency },
                                { txId: tx.id, accountId: userAcc.id, debit: 0 as any, credit: amountStr as any, currency }
                            ]
                        });
                    });
                } else {
                    await prisma.tx.update({ where: { id: tx.id }, data: { status: TxStatus.FAILED } });
                }
            }
        }

        res.status(200).send('ok');
    } catch (err: any) {
        console.log(`webhook error: ${err}`);
        req.log.error({ err }, 'webhook error');
        res.status(200).send('ok'); // avoid retry
    }
});*/

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});