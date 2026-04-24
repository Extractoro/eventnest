import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName:  z.string().min(2).max(50),
  email:     z.string().email(),
  password:  z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase letter').regex(/[0-9]/, 'Must contain a number'),
  phone:     z.string().regex(/^\+?[0-9]{7,15}$/).optional(),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const resendVerificationSchema = z.object({
  email: z.string().email(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase letter').regex(/[0-9]/, 'Must contain a number'),
});
