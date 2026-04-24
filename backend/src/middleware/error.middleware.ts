import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { apiError } from '../utils/response';

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(apiError(err.message));
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json(apiError('Validation failed', err.issues));
    return;
  }
  console.error(err);
  res.status(500).json(apiError('Internal server error'));
};
