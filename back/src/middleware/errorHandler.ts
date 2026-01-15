import { Request, Response, NextFunction } from "express";

import { AppError } from "../errors/AppErrors.js";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
    req.log?.error?.({ err }, "Unhandle error");

    //Erreurs métier
    if (err instanceof AppError) {
        return res.status(err.statusCode ?? 400).json({
            error: {
                code: err.code,
                message: err.message
            }
        });
    }

    return res.status(500).json({
        error: {
            code: "INTERNAL_ERROR",
            message:
                process.env.NODE_ENV === "production"
                    ? "Internal server error"
                    : err.message
        }
    });
};