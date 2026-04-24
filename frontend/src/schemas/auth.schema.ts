import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Min 2 characters').max(50),
  lastName:  z.string().min(2, 'Min 2 characters').max(50),
  email:     z.string().email('Invalid email'),
  password:  z
    .string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number').optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Min 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine(d => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z
      .string()
      .min(8, 'Min 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine(d => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'Min 2 characters').max(50).optional().or(z.literal('')),
  lastName:  z.string().min(2, 'Min 2 characters').max(50).optional().or(z.literal('')),
  phone:     z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number').optional().or(z.literal('')),
});

export type RegisterFormData      = z.infer<typeof registerSchema>;
export type LoginFormData         = z.infer<typeof loginSchema>;
export type ForgotPasswordData    = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData     = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordData    = z.infer<typeof changePasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
