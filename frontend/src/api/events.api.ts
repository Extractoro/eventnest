import { apiClient } from './client';
import type { ApiResponse, Event, EventFilters, PaginatedResponse } from '../types';

export const getAll = (filters: EventFilters = {}) =>
  apiClient.get<ApiResponse<PaginatedResponse<Event>>>('/events', { params: filters });

export const getById = (id: number) =>
  apiClient.get<ApiResponse<Event>>(`/events/${id}`);

export const create = (data: unknown) =>
  apiClient.post<ApiResponse<Event>>('/events', data);

export const update = (id: number, data: unknown) =>
  apiClient.patch<ApiResponse<Event>>(`/events/${id}`, data);

export const remove = (id: number) =>
  apiClient.delete<ApiResponse>(`/events/${id}`);
