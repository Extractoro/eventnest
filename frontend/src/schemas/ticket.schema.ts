import { z } from 'zod';

export const bookTicketSchema = z.object({
  quantity: z.number().int().min(1, 'Min 1'),
});

export type BookTicketFormData = z.infer<typeof bookTicketSchema>;
