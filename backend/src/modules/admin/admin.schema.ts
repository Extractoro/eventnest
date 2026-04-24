import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

export const adminUsersQuerySchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createVenueSchema = z.object({
  venue_name: z.string().min(2).max(100),
  address:    z.string().min(5).max(255),
  city:       z.string().min(2).max(50),
  capacity:   z.number().int().positive(),
});
