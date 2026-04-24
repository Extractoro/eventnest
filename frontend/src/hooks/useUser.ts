import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as usersApi from '../api/users.api';
import * as adminApi from '../api/admin.api';
import { getErrorMessage } from '../utils/errorMessage';
import { useAuthStore } from '../store/auth.store';

export const useProfile = () =>
  useQuery({
    queryKey: ['profile'],
    queryFn: () => usersApi.getMe().then(r => r.data.data!),
  });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => toast.success('Password changed'),
    onError:   (err) => toast.error(getErrorMessage(err)),
  });

export const useAdminUsers = (page: number, limit: number) =>
  useQuery({
    queryKey: ['admin-users', page, limit],
    queryFn: () => adminApi.getUsers(page, limit).then(r => r.data.data!),
  });

export const useUpdateRole = () => {
  const qc = useQueryClient();
  const { userId: currentUserId, setAuth, accessToken, role: currentRole } = useAuthStore();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: 'user' | 'admin' }) =>
      adminApi.updateRole(userId, role),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Role updated');
      // Sync store when the logged-in admin changes their own role
      if (variables.userId === currentUserId && accessToken && currentRole) {
        setAuth(currentUserId, variables.role, accessToken);
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};

export const useStatistics = () =>
  useQuery({
    queryKey: ['statistics'],
    queryFn: () => adminApi.getStatistics().then(r => r.data.data!),
  });
