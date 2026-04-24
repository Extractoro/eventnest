import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

export const findByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });

export const findById = (user_id: number) =>
  prisma.user.findUnique({ where: { user_id } });

export const findByVerificationToken = (verificationToken: string) =>
  prisma.user.findFirst({ where: { verificationToken } });

export const findByResetToken = (resetPasswordToken: string) =>
  prisma.user.findFirst({ where: { resetPasswordToken } });

export const create = (data: Prisma.UserCreateInput) =>
  prisma.user.create({ data });

export const update = (user_id: number, data: Prisma.UserUpdateInput) =>
  prisma.user.update({ where: { user_id }, data });
