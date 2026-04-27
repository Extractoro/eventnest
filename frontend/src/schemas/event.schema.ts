import { z } from 'zod';

// Base field definitions shared by both create and edit form schemas.
const eventFormFields = z.object({
  event_name:      z.string().min(3, 'Min 3 characters').max(100),
  event_date:      z.string().min(1, 'Required'),
  description:     z.string().max(2000).optional().or(z.literal('')),
  ticket_price:    z.number({ error: 'Must be a number' }).positive('Must be positive'),
  capacity_event:  z.number({ error: 'Must be a number' }).int().positive('Must be positive'),
  isAvailable:     z.boolean(),
  venue_name:      z.string().min(2, 'Min 2 characters'),
  address:         z.string().min(5, 'Min 5 characters'),
  city:            z.string().min(2, 'Min 2 characters'),
  capacity:        z.number({ error: 'Must be a number' }).int().positive('Must be positive'),
  category:        z.string().min(1, 'Required'),
  isRecurring:     z.boolean(),
  start_date:      z.string().optional().or(z.literal('')),
  end_date:        z.string().optional().or(z.literal('')),
  frequency:       z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  repeat_interval: z.number().int().min(1),
});

// Create: enforces future event_date + recurring rules + capacity constraint.
export const createEventSchema = eventFormFields
  .refine(d => !d.isRecurring || (d.start_date && d.end_date && d.frequency), {
    message: 'Recurring events require start date, end date, and frequency',
    path: ['frequency'],
  })
  .refine(
    d => !d.isRecurring || !d.start_date || !d.end_date || new Date(d.start_date) < new Date(d.end_date),
    { message: 'End date must be after start date', path: ['end_date'] },
  )
  .refine(d => d.capacity_event <= d.capacity, {
    message: 'Event capacity cannot exceed venue capacity',
    path: ['capacity_event'],
  })
  .refine(d => !d.event_date || new Date(d.event_date) > new Date(), {
    message: 'Event date must be in the future',
    path: ['event_date'],
  });

// Edit: no future-date constraint — admin may update events with past dates.
export const editEventFormSchema = eventFormFields
  .refine(d => !d.isRecurring || (d.start_date && d.end_date && d.frequency), {
    message: 'Recurring events require start date, end date, and frequency',
    path: ['frequency'],
  })
  .refine(
    d => !d.isRecurring || !d.start_date || !d.end_date || new Date(d.start_date) < new Date(d.end_date),
    { message: 'End date must be after start date', path: ['end_date'] },
  )
  .refine(d => d.capacity_event <= d.capacity, {
    message: 'Event capacity cannot exceed venue capacity',
    path: ['capacity_event'],
  });

export type CreateEventFormData = z.infer<typeof createEventSchema>;
export type EditEventFormData   = z.infer<typeof editEventFormSchema>;
