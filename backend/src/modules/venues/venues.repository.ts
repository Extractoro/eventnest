import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

export const findAll = () => prisma.venue.findMany({ orderBy: { venue_name: 'asc' } });

export const findById = (venue_id: number) =>
  prisma.venue.findUnique({ where: { venue_id } });

export const findByName = (venue_name: string) =>
  prisma.venue.findUnique({ where: { venue_name } });

export const create = (data: Prisma.VenueCreateInput) =>
  prisma.venue.create({ data });

export const update = (venue_id: number, data: Prisma.VenueUpdateInput) =>
  prisma.venue.update({ where: { venue_id }, data });

export const deleteById = (venue_id: number) =>
  prisma.venue.delete({ where: { venue_id } });
