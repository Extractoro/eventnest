import { apiClient } from './client';
import type { ApiResponse, Ticket } from '../types';

export const book = (data: { eventId: number; quantity: number }) =>
  apiClient.post<ApiResponse<Ticket>>('/tickets/book', data);

export const pay = (ticketIds: number[]) =>
  apiClient.post<ApiResponse<{ updated: number }>>('/tickets/pay', { ticketIds });

export const cancel = (ticketIds: number[]) =>
  apiClient.post<ApiResponse<{ updated: number }>>('/tickets/cancel', { ticketIds });

export const getMyTickets = () =>
  apiClient.get<ApiResponse<Ticket[]>>('/tickets/my');
