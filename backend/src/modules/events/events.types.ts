import { z } from 'zod';
import { createEventSchema, updateEventSchema, eventQuerySchema } from './events.schema';

export type CreateEventDto  = z.infer<typeof createEventSchema>;
export type UpdateEventDto  = z.infer<typeof updateEventSchema>;
export type EventFilters    = z.infer<typeof eventQuerySchema>;
