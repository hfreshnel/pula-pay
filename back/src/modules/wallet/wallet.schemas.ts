import { z } from "zod";

export const depositSchema = z.object({
  userId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
  msisdn: z.string().min(5),
  currency: z.string().default("EUR"),
});

export const withdrawSchema = depositSchema;

export const transferSchema = z.object({
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
  currency: z.string().default("EUR"),
});

export const txIdParamsSchema = z.object({
  txId: z.string().uuid(),
});

export const userIdParamsSchema = z.object({
  userId: z.string().uuid(),
});