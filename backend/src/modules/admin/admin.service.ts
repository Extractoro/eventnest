import { NotFoundError } from '../../utils/errors';
import * as adminRepo from './admin.repository';
import * as venueService from '../venues/venues.service';
import * as categoryService from '../categories/categories.service';
import type { z } from 'zod';
import type { adminUsersQuerySchema, createVenueSchema } from './admin.schema';

type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
type CreateVenueDto  = z.infer<typeof createVenueSchema>;

export const getUsers = (query: AdminUsersQuery) =>
  adminRepo.findAllUsers(query.page, query.limit);

export const updateRole = async (userId: number, role: 'user' | 'admin') => {
  const user = await adminRepo.findUserById(userId);
  if (!user) throw new NotFoundError('User not found');
  return adminRepo.updateUserRole(userId, role);
};

export const getStatistics = () => adminRepo.getStatistics();

export const getVenues  = () => venueService.getAll();
export const createVenue = (dto: CreateVenueDto) => venueService.create(dto);

export const getCategories = () => categoryService.getAll();
