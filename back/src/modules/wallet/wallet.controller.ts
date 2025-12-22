import { Request, Response } from "express";
import crypto from "crypto";

import * as walletService from "./wallet.service.js";
import { NotFoundError, BadRequestError } from "../../errors/AppErrors.js";
import userService from "../../services/userService.js";

export async function createDeposit(req: Request, res: Response) {
    const userId = req.user!.id;
    const { amount, msisdn, currency } = req.body;
    const idempotencyKey = req.header("x-idempotency-key") ?? crypto.randomUUID();
    const txId = await walletService.createDeposit({ userId, amount, msisdn, currency, idempotencyKey });
    return res.status(201).json({ txId });
}

export async function createWithdraw(req: Request, res: Response) {
    const userId = req.user!.id;
    const { amount, msisdn, currency } = req.body;
    const idempotencyKey = req.header("x-idempotency-key") ?? crypto.randomUUID();
    const txId = await walletService.createWithdrawal({ userId, amount, msisdn, currency, idempotencyKey });
    return res.status(201).json({ txId });

}

export async function getTransactionStatus(req: Request, res: Response) {
    const { txId } = req.params;
    const status = await walletService.pollTransactionStatus(txId);
    return res.status(200).json({ status });
}

export async function getTransactions(req: Request, res: Response) {
    const userId = req.user!.id;
    const txs = await walletService.getUserTransactions(userId);
    res.status(200).json({ txs });
}

export async function getAccountBalance(req: Request, res: Response) {
    const userId = req.user!.id;
    const currency = (req.query.currency as string) ?? "EUR";
    const balance = await walletService.getAccountBalance(userId, currency);
    res.status(200).json({ balance });
}

export async function transfer(req: Request, res: Response) {
    const senderId = req.user!.id;
    const { receiverId, amount, currency } = req.body;
    const idempotencyKey = req.header("x-idempotency-key") ?? crypto.randomUUID();
    const txId = await walletService.transfer({ senderId, receiverId, amount, currency, idempotencyKey });
    res.status(201).json({ txId });
}

export async function resolveRecipient(req: Request, res: Response) {
  const senderId = req.user!.id;
  const { phone } = req.query as { phone: string };

  const user = await userService.getUserByPhone(phone);
  if (!user) {
    throw new NotFoundError("Recipient not found");
  }

  if (user.id === senderId) {
    throw new BadRequestError("Cannot send to yourself", "SELF_TRANSFER");
  }

  return res.status(200).json({ userId: user.id });
}
