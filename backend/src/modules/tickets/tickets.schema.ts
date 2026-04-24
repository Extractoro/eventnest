import { z } from 'zod';

export const bookTicketSchema = z.object({
  eventId:  z.number().int().positive(),
  quantity: z.number().int().min(1).max(20),
});

export const ticketIdsSchema = z.object({
  ticketIds: z.array(z.number().int().positive()).min(1),
});
