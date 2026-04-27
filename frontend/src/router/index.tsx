import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PrivateRoute }       from './PrivateRoute';
import { AdminRoute }         from './AdminRoute';
import { ErrorBoundary }      from '../components/ui';
import HomePage               from '../pages/HomePage';
import EventDetailPage        from '../pages/EventDetailPage';
import LoginPage              from '../pages/LoginPage';
import RegisterPage           from '../pages/RegisterPage';
import SignupConfirmPage       from '../pages/SignupConfirmPage';
import ForgotPasswordPage     from '../pages/ForgotPasswordPage';
import ResetPasswordPage      from '../pages/ResetPasswordPage';
import UserTicketsPage        from '../pages/UserTicketsPage';
import ProfilePage            from '../pages/ProfilePage';
import AdminAddEventPage      from '../pages/AdminAddEventPage';
import AdminStatisticsPage    from '../pages/AdminStatisticsPage';
import AdminUsersPage         from '../pages/AdminUsersPage';
import AdminEditEventPage     from '../pages/AdminEditEventPage';
import AdminPanelPage         from '../pages/AdminPanelPage';
import NotFoundPage           from '../pages/NotFoundPage';

const wrap = (element: React.ReactElement) => (
  <ErrorBoundary>{element}</ErrorBoundary>
);

const router = createBrowserRouter([
  // Public
  { path: '/login',                      element: wrap(<LoginPage />) },
  { path: '/register',                   element: wrap(<RegisterPage />) },
  { path: '/auth/verify/:token',         element: wrap(<SignupConfirmPage />) },
  { path: '/signup-confirm',             element: wrap(<SignupConfirmPage />) },
  { path: '/forgot-password',            element: wrap(<ForgotPasswordPage />) },
  { path: '/auth/reset-password/:token', element: wrap(<ResetPasswordPage />) },

  // Authenticated
  { element: <PrivateRoute />, children: [
    { path: '/',                element: wrap(<HomePage />) },
    { path: '/events/:id',      element: wrap(<EventDetailPage />) },
    { path: '/tickets',         element: wrap(<UserTicketsPage />) },
    { path: '/profile',         element: wrap(<ProfilePage />) },

    // Admin only
    { element: <AdminRoute />, children: [
      { path: '/admin/events/new',          element: wrap(<AdminAddEventPage />) },
      { path: '/admin/events/:id/edit',    element: wrap(<AdminEditEventPage />) },
      { path: '/admin/statistics',   element: wrap(<AdminStatisticsPage />) },
      { path: '/admin/users',        element: wrap(<AdminUsersPage />) },
      { path: '/admin/panel',        element: wrap(<AdminPanelPage />) },
    ]},
  ]},

  { path: '*', element: <NotFoundPage /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;
