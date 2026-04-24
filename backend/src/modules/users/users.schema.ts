import { z } from 'zod';

export const updateMeSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName:  z.string().min(2).max(50).optional(),
  phone:     z.string().regex(/^\+?[0-9]{7,15}$/).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase letter').regex(/[0-9]/, 'Must contain a number'),
});
