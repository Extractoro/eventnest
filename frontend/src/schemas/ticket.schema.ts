import { z } from 'zod';

export const bookTicketSchema = z.object({
  quantity: z.number().int().min(1, 'Min 1').max(20, 'Max 20'),
});

export type BookTicketFormData = z.infer<typeof bookTicketSchema>;
