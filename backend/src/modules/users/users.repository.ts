import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

export const findById = (user_id: number) =>
  prisma.user.findUnique({
    where: { user_id },
    select: {
      user_id: true, user_firstname: true, user_lastname: true,
      email: true, phone: true, role: true, created_at: true, verify: true,
    },
  });

export const update = (user_id: number, data: Prisma.UserUpdateInput) =>
  prisma.user.update({
    where: { user_id },
    data,
    select: {
      user_id: true, user_firstname: true, user_lastname: true,
      email: true, phone: true, role: true, created_at: true,
    },
  });

export const findByIdWithPassword = (user_id: number) =>
  prisma.user.findUnique({ where: { user_id } });
