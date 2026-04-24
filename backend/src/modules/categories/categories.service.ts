import { NotFoundError } from '../../utils/errors';
import * as categoryRepo from './categories.repository';

export const getAll = () => categoryRepo.findAll();

export const getOrCreateByName = async (category_name: string) => {
  const existing = await categoryRepo.findByName(category_name);
  if (existing) return existing;
  const { prisma } = await import('../../config/database');
  return prisma.category.create({ data: { category_name } });
};

export const getByName = async (category_name: string) => {
  const cat = await categoryRepo.findByName(category_name);
  if (!cat) throw new NotFoundError(`Category "${category_name}" not found`);
  return cat;
};
