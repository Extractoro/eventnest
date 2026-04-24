import { Role } from '@prisma/client';
import { z } from 'zod';
import { registerSchema, loginSchema, resetPasswordSchema } from './auth.schema';

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto    = z.infer<typeof loginSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

export interface AccessTokenPayload {
  userId: number;
  role: Role;
}

export interface RefreshTokenPayload {
  userId: number;
}
