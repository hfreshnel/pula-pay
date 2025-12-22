import { Request, Response } from "express";

import userService from "../../services/userService.js";
import { NotFoundError } from "../../errors/AppErrors.js";

export async function getAppUser(req: Request, res: Response) {
        const user = await userService.getUserById(req.user!.id);

        if (!user) {
            throw new NotFoundError("User not found");
        }
        return res.status(200).json({ 
            id: user.id,
            phone: user.phone,
            isVerified: user.isVerified,
            email: user.email
         });
}