import { apiClient } from './client';
import type { ApiResponse } from '../types';

export interface LoginResponse {
  accessToken: string;
  role: 'user' | 'admin';
  userId: number;
}

export const register = (data: {
  firstName: string; lastName: string;
  email: string; password: string; phone?: string;
}) => apiClient.post<ApiResponse>('/auth/register', data);

export const login = (data: { email: string; password: string }) =>
  apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);

export const logout = () => apiClient.post<ApiResponse>('/auth/logout');

export const forgotPassword = (email: string) =>
  apiClient.post<ApiResponse>('/auth/forgot-password', { email });

export const resetPassword = (token: string, newPassword: string) =>
  apiClient.post<ApiResponse>(`/auth/reset-password/${token}`, { newPassword });

export const resendVerification = (email: string) =>
  apiClient.post<ApiResponse>('/auth/resend-verification', { email });
