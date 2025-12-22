import { AnyZodObject, ZodError } from "zod";
import { RequestHandler } from "express";

import { ValidationError } from "../errors/AppErrors.js";

export function validateBody(schema: AnyZodObject): RequestHandler {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                throw new ValidationError("Invalid request body");
            }
            throw err;
        }
    };
};

export function validateParams(schema: AnyZodObject): RequestHandler {
    return (req, res, next) => {
        try {
            req.params = schema.parse(req.params);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                throw new ValidationError("Invalid request parameters");
            }
            throw err;
        }
    };
};

export function validateQuery(schema: AnyZodObject): RequestHandler {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                throw new ValidationError("Invalid request query");
            }
            throw err;
        }
    };
}