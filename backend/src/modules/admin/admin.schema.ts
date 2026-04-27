import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

export const adminUsersQuerySchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const adminEventsQuerySchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createVenueSchema = z.object({
  venue_name: z.string().min(2).max(100),
  address:    z.string().min(5).max(255),
  city:       z.string().min(2).max(50),
  capacity:   z.number().int().positive(),
});

export const updateVenueSchema = z.object({
  venue_name: z.string().min(2).max(100).optional(),
  address:    z.string().min(5).max(255).optional(),
  city:       z.string().min(2).max(50).optional(),
  capacity:   z.number().int().positive().optional(),
});

export const adminUpdateEventSchema = z.object({
  event_name:     z.string().min(3).max(100).optional(),
  event_date:     z.string().datetime().optional(),
  description:    z.string().max(2000).optional(),
  ticket_price:   z.number().positive().optional(),
  capacity_event: z.number().int().positive().optional(),
  isAvailable:    z.boolean().optional(),
});
