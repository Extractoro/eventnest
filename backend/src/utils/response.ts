import { ZodIssue } from 'zod';

export const success = <T>(message: string, data?: T) => ({
  success: true,
  message,
  ...(data !== undefined && { data }),
});

export const apiError = (message: string, errors?: ZodIssue[]) => ({
  success: false,
  message,
  ...(errors && { errors }),
});
