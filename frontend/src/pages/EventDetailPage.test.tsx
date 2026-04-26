import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import EventDetailPage from './EventDetailPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { server } from '../test/server';
import { useAuthStore } from '../store/auth.store';
import { MOCK_EVENT } from '../test/handlers';
import type { ApiResponse, Event } from '../types';

/**
 * EventDetailPage uses useParams<{ id }>, so it must be rendered inside a
 * Route that defines the ':id' segment — otherwise useParams returns undefined.
 */
const renderDetailPage = () =>
  renderWithProviders(
    <Routes>
      <Route path="/events/:id" element={<EventDetailPage />} />
    </Routes>,
    { initialEntries: ['/events/1'] },
  );

describe('EventDetailPage', () => {
  it('shows a spinner while the event is loading', () => {
    renderDetailPage();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the event name after loading', async () => {
    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /rock night/i })).toBeInTheDocument();
    });
  });

  it('renders the available ticket count', async () => {
    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByText(/120 seats remaining/i)).toBeInTheDocument();
    });
  });

  it('renders the venue name and city', async () => {
    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByText(/main stage arena/i)).toBeInTheDocument();
      expect(screen.getByText(/kharkiv/i)).toBeInTheDocument();
    });
  });

  it('renders the ticket price', async () => {
    renderDetailPage();
    // formatPrice uses ₴ (Ukrainian hryvnia) symbol, not $
    await waitFor(() => {
      expect(screen.getByText(/₴25\.00/)).toBeInTheDocument();
    });
  });

  it('shows the Book Tickets button for authenticated regular users', async () => {
    useAuthStore.setState({ isAuthenticated: true, role: 'user', userId: 42, accessToken: 'tok' });
    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /book tickets/i })).toBeInTheDocument();
    });
  });

  it('hides the Book Tickets button for admin users', async () => {
    useAuthStore.setState({ isAuthenticated: true, role: 'admin', userId: 1, accessToken: 'tok' });
    renderDetailPage();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /book tickets/i })).not.toBeInTheDocument();
    });
  });

  it('shows "Sold Out" when available_tickets is 0', async () => {
    const soldOutEvent: Event = { ...MOCK_EVENT, available_tickets: 0, isAvailable: false };
    server.use(
      http.get('http://localhost:8080/events/1', () => {
        const body: ApiResponse<Event> = { success: true, message: 'OK', data: soldOutEvent };
        return HttpResponse.json(body);
      }),
    );

    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByText(/sold out/i)).toBeInTheDocument();
    });
  });

  it('shows an error message when the event is not found', async () => {
    server.use(
      http.get('http://localhost:8080/events/1', () =>
        HttpResponse.json({ success: false, message: 'Not found' }, { status: 404 }),
      ),
    );

    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByText(/event not found/i)).toBeInTheDocument();
    });
  });

  it('renders a back navigation button', async () => {
    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /← back/i })).toBeInTheDocument();
    });
  });
});
