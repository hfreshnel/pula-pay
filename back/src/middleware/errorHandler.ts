import { error } from "console";
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
    req.log?.error?.({ err }, "Unhandle error");

    if (err instanceof ZodError) {
        return res.status(400).json({ error: "Invalid input", details: err.errors });
    }

    //Erreurs métier
    if (err.name === "AppError") {
        return res.status(err.statusCode ?? 400).json({ error: err.message, code: err.code });
    }

    return res.status(500).json({
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
};