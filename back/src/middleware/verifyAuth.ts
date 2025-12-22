import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import { UnauthorizedError, InternalError } from "../errors/AppErrors.js";

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
            };
        }
    }
}

export default function verifyAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        throw new UnauthorizedError("Missing authentication token");
    }

    const token = header?.split(" ")[1];
    if (!token) {
        throw new UnauthorizedError("Missing authentication token");
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new InternalError("JWT secret is not configured");
    }

    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        if (!decoded.userId) {
            throw new UnauthorizedError("Malformed token");
        }

        req.user = {
            id: decoded.userId,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new UnauthorizedError("Token expired");
        } else if (error instanceof jwt.JsonWebTokenError) {
            throw new UnauthorizedError("Invalid token");
        } else if (error instanceof jwt.NotBeforeError) {
            throw new UnauthorizedError("Token not active yet");
        } else {
            throw new InternalError("Token verification failed");
        }
    }
}