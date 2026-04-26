import { http, HttpResponse } from 'msw';
import type { ApiResponse, Event, PaginatedResponse } from '../types';

const BASE_URL = 'http://localhost:8080';

// ─── Shared mock data ─────────────────────────────────────────────────────────

export const MOCK_EVENT: Event = {
  event_id: 1,
  event_name: 'Rock Night',
  event_date: '2026-06-15T20:00:00.000Z',
  description: 'A great rock concert',
  ticket_price: '25.00',
  capacity_event: 500,
  isAvailable: true,
  is_recurring: false,
  available_tickets: 120,
  venue: {
    venue_id: 1,
    venue_name: 'Main Stage Arena',
    address: '1 Arena Rd',
    city: 'Kharkiv',
    capacity: 500,
  },
  category: { category_id: 1, category_name: 'Concert' },
  recurringEvent: null,
};

export const MOCK_EVENT_2: Event = {
  event_id: 2,
  event_name: 'Jazz Evening',
  event_date: '2026-07-20T19:00:00.000Z',
  description: null,
  ticket_price: '15.00',
  capacity_event: 200,
  isAvailable: true,
  is_recurring: false,
  available_tickets: 50,
  venue: {
    venue_id: 2,
    venue_name: 'Blue Note Club',
    address: '5 Jazz St',
    city: 'Kyiv',
    capacity: 200,
  },
  category: { category_id: 2, category_name: 'Jazz' },
  recurringEvent: null,
};

export const MOCK_ACCESS_TOKEN = 'mock-access-token-abc123';

// ─── Default handlers ─────────────────────────────────────────────────────────

export const handlers = [
  // GET /events — paginated list
  http.get(`${BASE_URL}/events`, () => {
    const body: ApiResponse<PaginatedResponse<Event>> = {
      success: true,
      message: 'OK',
      data: { data: [MOCK_EVENT, MOCK_EVENT_2], total: 2, page: 1, limit: 12 },
    };
    return HttpResponse.json(body);
  }),

  // GET /events/:id — single event
  http.get(`${BASE_URL}/events/:id`, ({ params }) => {
    const id = Number(params['id']);
    const event = [MOCK_EVENT, MOCK_EVENT_2].find(e => e.event_id === id);
    if (!event) return HttpResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    const body: ApiResponse<Event> = { success: true, message: 'OK', data: event };
    return HttpResponse.json(body);
  }),

  // POST /auth/login — returns access token
  http.post(`${BASE_URL}/auth/login`, () => {
    const body: ApiResponse<{ accessToken: string; role: string; userId: number }> = {
      success: true,
      message: 'Logged in',
      data: { accessToken: MOCK_ACCESS_TOKEN, role: 'user', userId: 42 },
    };
    return HttpResponse.json(body);
  }),

  // POST /auth/register — success
  http.post(`${BASE_URL}/auth/register`, () =>
    HttpResponse.json({ success: true, message: 'Registered' }),
  ),

  // POST /auth/logout — success
  http.post(`${BASE_URL}/auth/logout`, () =>
    HttpResponse.json({ success: true, message: 'Logged out' }),
  ),

  // POST /auth/refresh — returns new access token
  http.post(`${BASE_URL}/auth/refresh`, () => {
    const body: ApiResponse<{ accessToken: string }> = {
      success: true,
      message: 'Refreshed',
      data: { accessToken: MOCK_ACCESS_TOKEN },
    };
    return HttpResponse.json(body);
  }),

  // POST /tickets — book ticket
  http.post(`${BASE_URL}/tickets`, () =>
    HttpResponse.json({ success: true, message: 'Booked' }, { status: 201 }),
  ),
];
