import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse, User, Venue, Category, Statistics, Event } from '../types';

export const getUsers = (page = 1, limit = 20) =>
  apiClient.get<ApiResponse<PaginatedResponse<User>>>('/admin/users', { params: { page, limit } });

export const updateRole = (userId: number, role: 'user' | 'admin') =>
  apiClient.patch<ApiResponse<User>>(`/admin/users/${userId}/role`, { role });

export const getStatistics = () =>
  apiClient.get<ApiResponse<Statistics>>('/admin/statistics');

// ── Events ───────────────────────────────────────────────────────────────────

export const getEvents = (page = 1, limit = 20) =>
  apiClient.get<ApiResponse<PaginatedResponse<Event>>>('/admin/events', { params: { page, limit } });

export interface UpdateEventDto {
  event_name?:     string;
  event_date?:     string;
  description?:    string;
  ticket_price?:   number;
  capacity_event?: number;
  isAvailable?:    boolean;
}

export const updateEvent = (eventId: number, data: UpdateEventDto) =>
  apiClient.patch<ApiResponse<Event>>(`/admin/events/${eventId}`, data);

export const deleteEvent = (eventId: number) =>
  apiClient.delete<ApiResponse>(`/admin/events/${eventId}`);

// ── Venues ───────────────────────────────────────────────────────────────────

export const getVenues = () =>
  apiClient.get<ApiResponse<Venue[]>>('/admin/venues');

export const createVenue = (data: Omit<Venue, 'venue_id'>) =>
  apiClient.post<ApiResponse<Venue>>('/admin/venues', data);

export const updateVenue = (venueId: number, data: Partial<Omit<Venue, 'venue_id'>>) =>
  apiClient.patch<ApiResponse<Venue>>(`/admin/venues/${venueId}`, data);

export const deleteVenue = (venueId: number) =>
  apiClient.delete<ApiResponse>(`/admin/venues/${venueId}`);

// ── Categories ───────────────────────────────────────────────────────────────

export const getCategories = () =>
  apiClient.get<ApiResponse<Category[]>>('/admin/categories');
