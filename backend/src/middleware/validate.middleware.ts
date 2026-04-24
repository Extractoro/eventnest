import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { apiError } from '../utils/response';

export const validate = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json(apiError('Validation failed', result.error.issues));
      return;
    }
    req.body = result.data;
    next();
  };
