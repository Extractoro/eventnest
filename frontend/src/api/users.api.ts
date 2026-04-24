import { apiClient } from './client';
import type { ApiResponse, User } from '../types';

export const getMe = () =>
  apiClient.get<ApiResponse<User>>('/users/me');

export const updateMe = (data: { firstName?: string; lastName?: string; phone?: string }) =>
  apiClient.patch<ApiResponse<User>>('/users/me', data);

export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  apiClient.post<ApiResponse>('/users/change-password', data);
