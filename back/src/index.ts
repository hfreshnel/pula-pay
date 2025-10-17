import cors from "cors";
import express from 'express';
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import { Prisma } from "@prisma/client";
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import accountService from "./services/accountService.js";
import txService from "./services/txService.js";
import { getRequestToPayStatus, getCollectionToken, requestToPay, transfer, getDisbursementsToken, getTransfertStatus } from './momo.js';
import { EntryKind, TxStatus } from "@prisma/client";

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }))
const port = process.env.PORT || 3000;

// Swagger setup
const swaggerOptions = {
    definition: {
        openapi: "3.1.0",
        info: {
            title: "PLA-Momo API",
            version: "1.0.0",
            description:
                "This is a simple CRUD API application made with Express and documented with Swagger",
        },
        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
    },
    apis: ["./src/routes/*.js"],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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

        const userAcc = await accountService.getOrCreateUserAccount(userId, currency);
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

        await transfer({ token, referenceId, amount, currency, msisdn, externalId: `withdraw-${referenceId}` })

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