import { z } from 'zod';

export const createEventSchema = z.object({
  event_name:      z.string().min(3).max(100),
  event_date:      z.string().datetime({ local: true }),
  description:     z.string().max(2000).optional(),
  ticket_price:    z.number().positive(),
  capacity_event:  z.number().int().positive(),
  isAvailable:     z.boolean().default(true),
  venue_name:      z.string().min(2),
  address:         z.string().min(5),
  city:            z.string().min(2),
  capacity:        z.number().int().positive(),
  category:        z.string().min(2),
  isRecurring:     z.boolean().default(false),
  start_date:      z.string().optional(),
  end_date:        z.string().optional(),
  frequency:       z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  repeat_interval: z.number().int().min(1).default(1),
})
  .refine(
    d => new Date(d.event_date) > new Date(),
    { message: 'Event date must be in the future', path: ['event_date'] },
  )
  .refine(
    d => !d.isRecurring || (d.start_date && d.end_date && d.frequency),
    { message: 'Recurring events require start_date, end_date, and frequency' },
  )
  .refine(
    d => !d.isRecurring || !d.start_date || !d.end_date || new Date(d.start_date) < new Date(d.end_date),
    { message: 'start_date must be before end_date', path: ['end_date'] },
  )
  .refine(
    d => d.capacity_event <= d.capacity,
    { message: 'capacity_event cannot exceed venue capacity' },
  );

export const updateEventSchema = z.object({
  event_name:      z.string().min(3).max(100).optional(),
  event_date:      z.string().datetime({ local: true }).optional(),
  description:     z.string().max(2000).optional(),
  ticket_price:    z.number().positive().optional(),
  capacity_event:  z.number().int().positive().optional(),
  isAvailable:     z.boolean().optional(),
  venue_name:      z.string().min(2).optional(),
  address:         z.string().min(5).optional(),
  city:            z.string().min(2).optional(),
  capacity:        z.number().int().positive().optional(),
  category:        z.string().min(2).optional(),
  isRecurring:     z.boolean().optional(),
  start_date:      z.string().optional(),
  end_date:        z.string().optional(),
  frequency:       z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  repeat_interval: z.number().int().min(1).optional(),
})
  .refine(
    d => !d.event_date || new Date(d.event_date) > new Date(),
    { message: 'Event date must be in the future', path: ['event_date'] },
  )
  .refine(
    d => d.isRecurring !== true || (d.start_date && d.end_date && d.frequency),
    { message: 'Recurring events require start_date, end_date, and frequency' },
  )
  .refine(
    d => !d.isRecurring || !d.start_date || d.start_date >= new Date().toISOString().slice(0, 10),
    { message: 'start_date cannot be in the past', path: ['start_date'] },
  )
  .refine(
    d => !d.isRecurring || !d.start_date || !d.end_date || new Date(d.start_date) < new Date(d.end_date),
    { message: 'start_date must be before end_date', path: ['end_date'] },
  );

export const eventQuerySchema = z.object({
  category: z.string().optional(),
  city:     z.string().optional(),
  date:     z.string().optional(),
  search:   z.string().optional(),
  page:     z.coerce.number().int().positive().default(1),
  limit:    z.coerce.number().int().positive().max(100).default(20),
});
