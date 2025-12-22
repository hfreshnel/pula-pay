import { NextFunction, Request, Response } from "express";
import * as authService from "./auth.service.js";

export async function register(req: Request, res: Response, next: NextFunction) {
        const { phone, password } = req.body;
        const user = await authService.registerUser(phone, password);
        return res.status(201).json({ userId: user.id });
}

export async function verify(req: Request, res: Response, next: NextFunction) {
        const { phone, otp } = req.body;
        await authService.verifyUser(phone, otp);
        return res.status(200).json({ verified: true });
}

export async function login(req: Request, res: Response, next: NextFunction) {
        const { phone, password } = req.body;
        const token = await authService.loginUser(phone, password);
        return res.status(200).json({ token });
}