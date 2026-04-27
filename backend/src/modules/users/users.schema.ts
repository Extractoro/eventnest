import { z } from 'zod';

export const updateMeSchema = z
  .object({
    firstName: z.string().min(2, 'Min 2 characters').max(50).optional(),
    lastName:  z.string().min(2, 'Min 2 characters').max(50).optional(),
    // Empty string means "leave unchanged"; transform it to undefined before service layer sees it.
    phone: z.union([
      z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number'),
      z.literal('').transform((): undefined => undefined),
    ]).optional(),
  })
  .refine(
    d => d.firstName !== undefined || d.lastName !== undefined || d.phone !== undefined,
    { message: 'At least one field must be provided' },
  );

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase letter').regex(/[0-9]/, 'Must contain a number'),
});
