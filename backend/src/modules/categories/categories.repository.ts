import { prisma } from '../../config/database';

export const findAll = () => prisma.category.findMany({ orderBy: { category_name: 'asc' } });

export const findByName = (category_name: string) =>
  prisma.category.findUnique({ where: { category_name } });

export const findById = (category_id: number) =>
  prisma.category.findUnique({ where: { category_id } });
