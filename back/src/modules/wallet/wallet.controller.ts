import { Request, Response } from "express";
import * as walletService from "./wallet.service.js";
import txService from "../../services/txService.js";

export async function createDeposit(req: Request, res: Response) {
  const { userId, amount, msisdn, currency } = req.body;
  const idempotencyKey = req.header("x-idempotency-key") ?? crypto.randomUUID();

  try {
    const txId = await walletService.createDeposit({ userId, amount, msisdn, currency, idempotencyKey });
    return res.status(202).json({ txId });
  } catch (err: any) {
    if (err?.txId) {
      try {
        await txService.updateTx(err.txId, "FAILED" as any);
      } catch (_) {}
    }
    throw err; // catch by errorHandler
  }
}

export async function createWithdraw(req: Request, res: Response) {
  const { userId, amount, msisdn, currency } = req.body;
  const idempotencyKey = req.header("x-idempotency-key") ?? crypto.randomUUID();

  try {
    const txId = await walletService.createWithdrawal({ userId, amount, msisdn, currency, idempotencyKey });
    return res.status(202).json({ txId });
  } catch (err: any) {
    if (err?.txId) {
      try {
        await txService.updateTx(err.txId, "FAILED" as any);
      } catch (_) {}
    }
    throw err;
  }
}

export async function getTransactionStatus(req: Request, res: Response) {
  const { txId } = req.params;
  const status = await walletService.pollTransactionStatus(txId);
  return res.json({ status });
}

export async function getTransactions(req: Request, res: Response) {
    const { userId } = req.params;
    const txs = await walletService.getUserTransactions(userId);
    res.json({ txs });
}

export async function getAccountBalance(req: Request, res: Response) {
    const { userId } = req.params;
    const currency = (req.query.currency as string) ?? "EUR";
    const balance = await walletService.getAccountBalance(userId, currency);
    res.json({ balance });
}

export async function transfer(req: Request, res: Response) {
    const { senderId, receiverId, amount, currency } = req.body;
    const idempotencyKey = req.header("x-idempotency-key") ?? crypto.randomUUID();
    const txId = await walletService.transfer({ senderId, receiverId, amount, currency, idempotencyKey });
    res.status(202).json({ txId });
}