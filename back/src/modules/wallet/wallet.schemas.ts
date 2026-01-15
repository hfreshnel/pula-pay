import { z } from "zod";

const amountSchema = z.string().regex(/^\d+(\.\d{1,6})?$/, "Invalid amount format");

const currencySchema = z.enum(["EUR", "XOF"]);

const msisdnSchema = z.string().regex(/^\+?\d{7,15}$/, "Invalid phone number format");

export const depositSchema = z.object({
  amount: amountSchema,
  msisdn: msisdnSchema,
  currency: currencySchema.default("EUR"),
});

export const withdrawSchema = z.object({
  amount: amountSchema,
  msisdn: msisdnSchema,
  currency: currencySchema.default("EUR"),
});

export const transferSchema = z.object({
  receiverId: z.string().uuid(),
  amount: amountSchema,
  currency: currencySchema.default("EUR"),
});

export const txIdParamsSchema = z.object({
  txId: z.string().uuid(),
});

export const userIdParamsSchema = z.object({
  userId: z.string().uuid(),
});

export const resolveRecipientQuerySchema = z.object({
  phone: msisdnSchema,
});