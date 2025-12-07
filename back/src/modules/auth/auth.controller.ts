import { NextFunction, Request, Response } from "express";
import * as authService from "./auth.service.js";

export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const { phone, password } = req.body;
        const user = await authService.registerUser(phone, password);
        return res.status(202).json({ userId: user.id });
    } catch (err) {
        next(err);
    }
}

export async function verify(req: Request, res: Response, next: NextFunction) {
    try {
        const { phone, otp } = req.body;
        await authService.verifyUser(phone, otp);
        return res.status(202).json({ verified: true, message: "Verification successful" });
    } catch (err) {
        next(err);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { phone, password } = req.body;
        const token = await authService.loginUser(phone, password);
        return res.status(202).json({ token });
    } catch (err) {
        next(err);
    }
}