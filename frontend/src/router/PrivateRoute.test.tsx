import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { useAuthStore } from '../store/auth.store';
import { renderWithProviders } from '../test/renderWithProviders';

const ProtectedContent = () => <div>Protected content</div>;
const LoginPage = () => <div>Login page</div>;

const renderRoutes = (initialEntry: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<ProtectedContent />} />
      </Route>
    </Routes>,
    { initialEntries: [initialEntry] },
  );

describe('PrivateRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false });
  });

  it('redirects unauthenticated users to /login', () => {
    renderRoutes('/dashboard');
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders the protected outlet for authenticated users', () => {
    useAuthStore.setState({ isAuthenticated: true });
    renderRoutes('/dashboard');
    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});
