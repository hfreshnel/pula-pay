import { error } from "console";
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        [key: string]: any;
      };
    }
  }
}

export default function verifyAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        res.status(401).json({ error: "Token manquant" });
    }

    const token = header?.split(" ")[1];

    if (!token) {
        res.status(401).json({ error: "Token manquant" });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        if (!decoded.userId) {
            res.status(401).json({ error: "Token malformé" });
            return;
        }

        req.user = {
            id: decoded.userId,
            ...decoded
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: "Token expiré" });
            return;
        } else if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ error: "Token invalide" });
            return;
        } else if (error instanceof jwt.NotBeforeError) {
            res.status(401).json({ error: "Token pas encore valide" });
            return;
        } else {
            console.error("JWT verification error:", error);
            res.status(500).json({ error: "Erreur de vérification du token" });
            return;
        }
    }
}