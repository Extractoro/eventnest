import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as authApi from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { getErrorMessage } from '../utils/errorMessage';

export const useLogin = () => {
  const setAuth    = useAuthStore(s => s.setAuth);
  const navigate   = useNavigate();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      const { accessToken, role, userId } = data.data!;
      setAuth(userId, role, accessToken);
      navigate('/');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};

export const useRegister = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success('Registration successful! Check your email to verify.');
      navigate('/login');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};

export const useLogout = () => {
  const clearAuth = useAuthStore(s => s.clearAuth);
  const navigate  = useNavigate();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth();
      navigate('/login');
    },
  });
};

export const useForgotPassword = () =>
  useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => toast.success('Reset link sent — check your email'),
    onError:   (err) => toast.error(getErrorMessage(err)),
  });

export const useResetPassword = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authApi.resetPassword(token, newPassword),
    onSuccess: () => {
      toast.success('Password reset successfully');
      navigate('/login');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};

export const useResendVerification = () =>
  useMutation({
    mutationFn: (email: string) => authApi.resendVerification(email),
    onSuccess: () => toast.success('Verification email resent'),
    onError:   (err) => toast.error(getErrorMessage(err)),
  });
