import { Prisma, TicketStatus } from '@prisma/client';
import { prisma } from '../../config/database';

const ticketInclude = {
  event: { include: { venue: true, category: true } },
} satisfies Prisma.TicketInclude;

export const findByUserId = (user_id: number) =>
  prisma.ticket.findMany({
    where: { user_id },
    include: ticketInclude,
    orderBy: { purchase_date: 'desc' },
  });

export const findManyByIds = (ids: number[], user_id: number) =>
  prisma.ticket.findMany({ where: { ticket_id: { in: ids }, user_id }, include: ticketInclude });

export const create = (data: Prisma.TicketUncheckedCreateInput) =>
  prisma.ticket.create({ data, include: ticketInclude });

export const updateManyStatus = (ids: number[], ticket_status: TicketStatus) =>
  prisma.ticket.updateMany({ where: { ticket_id: { in: ids } }, data: { ticket_status } });

export const getBookedCount = async (event_id: number): Promise<number> => {
  const result = await prisma.ticket.aggregate({
    where: { event_id, ticket_status: { not: 'cancelled' } },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
};
