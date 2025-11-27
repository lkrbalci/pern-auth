import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

export const validate = (schema: ZodType<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      });

      req.validated = {
        body: parsed.body,
        query: parsed.query,
        params: parsed.params,
        cookies: parsed.cookies,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
};
