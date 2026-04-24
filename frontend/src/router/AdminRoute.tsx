import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export const AdminRoute = () => {
  const role = useAuthStore(s => s.role);
  return role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
};
