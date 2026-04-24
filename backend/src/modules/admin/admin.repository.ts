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
