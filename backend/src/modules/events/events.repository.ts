import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import type { EventFilters } from './events.types';

const eventInclude = {
  venue:          true,
  category:       true,
  recurringEvent: true,
} satisfies Prisma.EventInclude;

export const findAll = async (filters: EventFilters) => {
  const { category, city, date, search, page, limit } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.EventWhereInput = {};
  if (category) where.category  = { category_name: { contains: category, mode: 'insensitive' } };
  if (city)     where.venue     = { city: { contains: city, mode: 'insensitive' } };
  if (search)   where.event_name = { contains: search, mode: 'insensitive' };
  if (date) {
    const start = new Date(date);
    const end   = new Date(date);
    end.setDate(end.getDate() + 1);
    where.event_date = { gte: start, lt: end };
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({ where, include: eventInclude, skip, take: limit, orderBy: { event_date: 'asc' } }),
    prisma.event.count({ where }),
  ]);

  const ids = events.map(e => e.event_id);
  const bookedMap = await prisma.ticket.groupBy({
    by: ['event_id'],
    where: { event_id: { in: ids }, ticket_status: { not: 'cancelled' } },
    _sum: { quantity: true },
  });
  const byEvent = Object.fromEntries(bookedMap.map(b => [b.event_id, b._sum.quantity ?? 0]));

  const data = events.map(e => ({
    ...e,
    available_tickets: e.capacity_event - (byEvent[e.event_id] ?? 0),
  }));

  return { data, total, page, limit };
};

export const findById = async (event_id: number) => {
  const event = await prisma.event.findUnique({ where: { event_id }, include: eventInclude });
  if (!event) return null;

  const booked = await prisma.ticket.aggregate({
    where: { event_id, ticket_status: { not: 'cancelled' } },
    _sum: { quantity: true },
  });
  return { ...event, available_tickets: event.capacity_event - (booked._sum.quantity ?? 0) };
};

export const create = (data: Prisma.EventCreateInput) =>
  prisma.event.create({ data, include: eventInclude });

export const update = (event_id: number, data: Prisma.EventUpdateInput) =>
  prisma.event.update({ where: { event_id }, data, include: eventInclude });

export const remove = (event_id: number) =>
  prisma.event.delete({ where: { event_id } });
