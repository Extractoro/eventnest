import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { AdminRoute } from './AdminRoute';
import { useAuthStore } from '../store/auth.store';
import { renderWithProviders } from '../test/renderWithProviders';

const AdminContent = () => <div>Admin content</div>;
const HomePage = () => <div>Home page</div>;

const renderRoutes = (initialEntry: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminContent />} />
      </Route>
    </Routes>,
    { initialEntries: [initialEntry] },
  );

describe('AdminRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ role: null });
  });

  it('redirects to / when user is not authenticated', () => {
    renderRoutes('/admin');
    expect(screen.getByText('Home page')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('redirects to / when user has role "user"', () => {
    useAuthStore.setState({ role: 'user' });
    renderRoutes('/admin');
    expect(screen.getByText('Home page')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('renders the admin outlet when user has role "admin"', () => {
    useAuthStore.setState({ role: 'admin' });
    renderRoutes('/admin');
    expect(screen.getByText('Admin content')).toBeInTheDocument();
    expect(screen.queryByText('Home page')).not.toBeInTheDocument();
  });
});
