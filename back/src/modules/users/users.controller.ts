import { Request, Response } from "express";
import userService from "../../services/userService.js";

export async function getAppUser(req: Request, res: Response) {
    try {
        const userData = await userService.getUserById(req.user!.id);

        if (!userData) {
            console.error("User not found", { userId: req.user!.id });
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json({ userData });
    } catch (err) {
        req.log?.error?.({ err }, "verification error");
        res.status(500).json({ error: "internal error" });
    }
}