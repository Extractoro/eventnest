import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export const adminMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.userId) throw new UnauthorizedError();
  if (req.role !== 'admin') throw new ForbiddenError('Admin access required');
  next();
};
