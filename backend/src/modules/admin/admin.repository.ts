import { Prisma, TicketStatus } from '@prisma/client';
import { prisma } from '../../config/database';

export const findAllUsers = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        user_id: true, user_firstname: true, user_lastname: true,
        email: true, phone: true, role: true, created_at: true, verify: true,
      },
    }),
    prisma.user.count(),
  ]);
  return { data: users, total, page, limit };
};

export const updateUserRole = (user_id: number, role: 'user' | 'admin') =>
  prisma.user.update({
    where: { user_id },
    data: { role },
    select: { user_id: true, email: true, role: true },
  });

export const findUserById = (user_id: number) =>
  prisma.user.findUnique({ where: { user_id }, select: { user_id: true } });

export const findAllEvents = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      skip,
      take:      limit,
      orderBy:   { event_date: 'asc' },
      include:   { venue: true, category: true, recurringEvent: true },
    }),
    prisma.event.count(),
  ]);

  const ids = events.map(e => e.event_id);
  const bookedMap = await prisma.ticket.groupBy({
    by:    ['event_id'],
    where: { event_id: { in: ids }, ticket_status: { not: 'cancelled' } },
    _sum:  { quantity: true },
  });
  const byEvent = Object.fromEntries(bookedMap.map(b => [b.event_id, b._sum.quantity ?? 0]));

  const data = events.map(e => ({
    ...e,
    available_tickets: e.capacity_event - (byEvent[e.event_id] ?? 0),
  }));

  return { data, total, page, limit };
};

export const getActiveTicketCount = async (event_id: number): Promise<number> => {
  const result = await prisma.ticket.aggregate({
    where: { event_id, ticket_status: { in: ['booked', 'paid'] } },
    _sum:  { quantity: true },
  });
  return result._sum.quantity ?? 0;
};

export const updateEvent = (event_id: number, data: Prisma.EventUpdateInput) =>
  prisma.event.update({
    where:   { event_id },
    data,
    include: { venue: true, category: true, recurringEvent: true },
  });

export const deleteEvent = (event_id: number) =>
  prisma.event.delete({ where: { event_id } });

// ── Tickets ───────────────────────────────────────────────────────────────────

const ticketAdminInclude = {
  event:  { include: { venue: true, category: true } },
  user:   { select: { user_id: true, user_firstname: true, user_lastname: true, email: true } },
} satisfies Prisma.TicketInclude;

/**
 * Returns a paginated list of all tickets across all users.
 * Supports optional status filter and full-text search by user email or event name.
 */
export const findAllTickets = async (
  page: number,
  limit: number,
  status?: TicketStatus,
  search?: string,
) => {
  const skip = (page - 1) * limit;

  const where: Prisma.TicketWhereInput = {
    ...(status && { ticket_status: status }),
    ...(search && {
      OR: [
        { user:  { email:      { contains: search, mode: 'insensitive' } } },
        { event: { event_name: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      skip,
      take:     limit,
      where,
      orderBy:  { purchase_date: 'desc' },
      include:  ticketAdminInclude,
    }),
    prisma.ticket.count({ where }),
  ]);

  return { data: tickets, total, page, limit };
};

/**
 * Overwrites the status of a single ticket.
 * Admin-only — no business-rule restrictions apply.
 */
export const setTicketStatus = (ticket_id: number, status: TicketStatus) =>
  prisma.ticket.update({
    where:   { ticket_id },
    data:    { ticket_status: status },
    include: ticketAdminInclude,
  });

export const getStatistics = async () => {
  const ticketsPerMonth = await prisma.$queryRaw<{ month: string; count: number }[]>`
    SELECT TO_CHAR(purchase_date, 'YYYY-MM') AS month, COUNT(*)::int AS count
    FROM "Ticket"
    WHERE ticket_status != 'cancelled'
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `;

  const popularCategories = await prisma.$queryRaw<{ category_name: string; count: number }[]>`
    SELECT c.category_name, COUNT(t.ticket_id)::int AS count
    FROM "Ticket" t
    JOIN "Event" e ON t.event_id = e.event_id
    JOIN "Category" c ON e.category_id = c.category_id
    WHERE t.ticket_status != 'cancelled'
    GROUP BY c.category_name
    ORDER BY count DESC
    LIMIT 10
  `;

  const revenuePerMonth = await prisma.$queryRaw<{ month: string; revenue: number }[]>`
    SELECT TO_CHAR(purchase_date, 'YYYY-MM') AS month,
           SUM(price_at_purchase * quantity)::float AS revenue
    FROM "Ticket"
    WHERE ticket_status != 'cancelled'
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `;

  return { ticketsPerMonth, popularCategories, revenuePerMonth };
};
