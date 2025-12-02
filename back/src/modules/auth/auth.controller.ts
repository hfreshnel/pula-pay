import { Request, Response } from "express";
import * as authService from "./auth.service.js";

export async function register(req: Request, res: Response) {
    const { phone, password } = req.body;
    const user = await authService.registerUser(phone, password);
    return res.status(202).json({ userId: user.id });
}

export async function verify(req: Request, res: Response) {
  const { phone, otp } = req.body;
  await authService.verifyUser(phone, otp);
  return res.status(202).json({ verified: true, message: "Verification successful" });
}

export async function login(req: Request, res: Response) {
  const { phone, password } = req.body;
  const token = await authService.loginUser(phone, password);
  return res.status(202).json({ token });
}