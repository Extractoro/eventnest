import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse, User, Venue, Category, Statistics } from '../types';

export const getUsers = (page = 1, limit = 20) =>
  apiClient.get<ApiResponse<PaginatedResponse<User>>>('/admin/users', { params: { page, limit } });

export const updateRole = (userId: number, role: 'user' | 'admin') =>
  apiClient.patch<ApiResponse<User>>(`/admin/users/${userId}/role`, { role });

export const getStatistics = () =>
  apiClient.get<ApiResponse<Statistics>>('/admin/statistics');

export const getVenues = () =>
  apiClient.get<ApiResponse<Venue[]>>('/admin/venues');

export const createVenue = (data: Omit<Venue, 'venue_id'>) =>
  apiClient.post<ApiResponse<Venue>>('/admin/venues', data);

export const getCategories = () =>
  apiClient.get<ApiResponse<Category[]>>('/admin/categories');
