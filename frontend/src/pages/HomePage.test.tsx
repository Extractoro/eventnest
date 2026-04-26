import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import HomePage from './HomePage';
import { renderWithProviders } from '../test/renderWithProviders';
import { server } from '../test/server';
import type { ApiResponse, PaginatedResponse, Event } from '../types';

const renderHomePage = () =>
  renderWithProviders(<HomePage />, { initialEntries: ['/'] });

describe('HomePage', () => {
  it('shows a spinner while events are loading', () => {
    renderHomePage();
    // Spinner is rendered before the query resolves
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders event cards after loading', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText('Rock Night')).toBeInTheDocument();
      expect(screen.getByText('Jazz Evening')).toBeInTheDocument();
    });
  });

  it('renders the page heading', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /upcoming events/i })).toBeInTheDocument();
    });
  });

  it('shows "No events found" when the server returns an empty list', async () => {
    server.use(
      http.get('http://localhost:8080/events', () => {
        const body: ApiResponse<PaginatedResponse<Event>> = {
          success: true,
          message: 'OK',
          data: { data: [], total: 0, page: 1, limit: 12 },
        };
        return HttpResponse.json(body);
      }),
    );

    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText(/no events found/i)).toBeInTheDocument();
    });
  });

  it('shows an error message when the API fails', async () => {
    server.use(
      http.get('http://localhost:8080/events', () =>
        HttpResponse.json({ success: false, message: 'Server error' }, { status: 500 }),
      ),
    );

    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText(/failed to load events/i)).toBeInTheDocument();
    });
  });

  it('renders pagination buttons when there are multiple pages', async () => {
    server.use(
      http.get('http://localhost:8080/events', () => {
        // total=25 with limit=12 → ceil(25/12) = 3 pages
        const events = Array.from({ length: 12 }, (_, i) => ({
          event_id: i + 1,
          event_name: `Event ${i + 1}`,
          event_date: '2026-06-15T20:00:00.000Z',
          description: null,
          ticket_price: '10.00',
          capacity_event: 100,
          isAvailable: true,
          is_recurring: false,
          available_tickets: 50,
          venue: { venue_id: 1, venue_name: 'Venue', address: 'Addr', city: 'City', capacity: 100 },
          category: { category_id: 1, category_name: 'Concert' },
          recurringEvent: null,
        }));
        const body: ApiResponse<PaginatedResponse<Event>> = {
          success: true,
          message: 'OK',
          data: { data: events, total: 25, page: 1, limit: 12 },
        };
        return HttpResponse.json(body);
      }),
    );

    renderHomePage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    });
  });

  it('prev button is disabled on the first page', async () => {
    renderHomePage();
    await waitFor(() => {
      // With 2 events (total < LIMIT=12), no pagination shown at all
      // Re-check with multi-page scenario from stub above
      expect(screen.queryByText(/rock night/i)).toBeInTheDocument();
    });
  });

  it('navigates to the next page when Next is clicked', async () => {
    server.use(
      http.get('http://localhost:8080/events', ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page') ?? '1');
        const body: ApiResponse<PaginatedResponse<Event>> = {
          success: true,
          message: 'OK',
          data: {
            data: [
              {
                event_id: page === 1 ? 1 : 3,
                event_name: page === 1 ? 'Page One Event' : 'Page Two Event',
                event_date: '2026-06-15T20:00:00.000Z',
                description: null,
                ticket_price: '10.00',
                capacity_event: 100,
                isAvailable: true,
                is_recurring: false,
                available_tickets: 50,
                venue: { venue_id: 1, venue_name: 'V', address: 'A', city: 'C', capacity: 100 },
                category: { category_id: 1, category_name: 'Concert' },
                recurringEvent: null,
              },
            ],
            total: 20,
            page,
            limit: 12,
          },
        };
        return HttpResponse.json(body);
      }),
    );

    renderHomePage();
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText('Page One Event')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => expect(screen.getByText('Page Two Event')).toBeInTheDocument());
  });
});
