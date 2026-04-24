import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as usersApi from '../api/users.api';
import * as adminApi from '../api/admin.api';
import { getErrorMessage } from '../utils/errorMessage';

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
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: 'user' | 'admin' }) =>
      adminApi.updateRole(userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Role updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};

export const useStatistics = () =>
  useQuery({
    queryKey: ['statistics'],
    queryFn: () => adminApi.getStatistics().then(r => r.data.data!),
  });
