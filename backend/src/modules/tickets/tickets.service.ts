import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors';
import * as ticketRepo from './tickets.repository';
import * as eventRepo from '../events/events.repository';
import type { z } from 'zod';
import type { bookTicketSchema, ticketIdsSchema } from './tickets.schema';

type BookDto      = z.infer<typeof bookTicketSchema>;
type TicketIdsDto = z.infer<typeof ticketIdsSchema>;

export const book = async (userId: number, dto: BookDto) => {
  const event = await eventRepo.findById(dto.eventId);
  if (!event) throw new NotFoundError('Event not found');
  if (!event.isAvailable) throw new BadRequestError('Event is not available for booking');

  const available = event.available_tickets;
  if (available < dto.quantity) {
    throw new BadRequestError(`Only ${available} ticket(s) remaining`);
  }

  return ticketRepo.create({
    event_id:          dto.eventId,
    user_id:           userId,
    quantity:          dto.quantity,
    price_at_purchase: event.ticket_price,
  });
};

export const pay = async (userId: number, dto: TicketIdsDto) => {
  const tickets = await ticketRepo.findManyByIds(dto.ticketIds, userId);

  if (tickets.length !== dto.ticketIds.length) {
    throw new NotFoundError('One or more tickets not found or do not belong to you');
  }

  const invalid = tickets.filter(t => t.ticket_status !== 'booked');
  if (invalid.length > 0) {
    throw new BadRequestError('Only tickets with status "booked" can be paid');
  }

  await ticketRepo.updateManyStatus(dto.ticketIds, 'paid');
  return { updated: dto.ticketIds.length };
};

export const cancel = async (userId: number, dto: TicketIdsDto) => {
  const tickets = await ticketRepo.findManyByIds(dto.ticketIds, userId);

  if (tickets.length !== dto.ticketIds.length) {
    throw new NotFoundError('One or more tickets not found or do not belong to you');
  }

  const invalid = tickets.filter(t => t.ticket_status === 'paid');
  if (invalid.length > 0) {
    throw new BadRequestError('Paid tickets cannot be cancelled');
  }

  await ticketRepo.updateManyStatus(dto.ticketIds, 'cancelled');
  return { updated: dto.ticketIds.length };
};

export const getUserTickets = (userId: number) => ticketRepo.findByUserId(userId);
