import { z } from "zod";

export const registerSchema = z.object({
    phone: z.string().regex(/^\+?\d{7,15}$/),
    password: z.string(),
});

export const verifySchema = z.object({
  phone: z.string().regex(/^\+?\d{7,15}$/),
  otp: z.string().length(6),
});

export const loginSchema = registerSchema;