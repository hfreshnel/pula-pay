import { AnyZodObject, ZodError } from "zod";
import { RequestHandler } from "express";
import { error } from "console";

export function validateBody(schema: AnyZodObject): RequestHandler {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                return res.status(400).json({ error: "Invalid input", details: err.errors });
            }
            next(err);
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
        return res.status(400).json({ error: "Invalid params", details: err.errors });
      }
      next(err);
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
        return res.status(400).json({ error: "Invalid query", details: err.errors });
      }
      next(err);
    }
  };
}