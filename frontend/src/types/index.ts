export type Role = 'user' | 'admin';

export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Venue {
  venue_id: number;
  venue_name: string;
  address: string;
  city: string;
  capacity: number;
}

export interface Category {
  category_id: number;
  category_name: string;
}

export interface RecurringEvent {
  recurring_event_id: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  repeat_interval: number;
  start_date: string;
  end_date: string;
}

export interface Event {
  event_id: number;
  event_name: string;
  event_date: string;
  description: string | null;
  ticket_price: string;
  capacity_event: number;
  isAvailable: boolean;
  is_recurring: boolean;
  available_tickets: number;
  venue: Venue;
  category: Category;
  recurringEvent: RecurringEvent | null;
}

export type TicketStatus = 'booked' | 'paid' | 'cancelled';

export interface Ticket {
  ticket_id: number;
  purchase_date: string;
  ticket_status: TicketStatus;
  quantity: number;
  price_at_purchase: string;
  event: Event;
}

export interface User {
  user_id: number;
  user_firstname: string;
  user_lastname: string;
  email: string;
  phone: string | null;
  role: Role;
  created_at: string;
  verify: boolean;
}

export interface EventFilters {
  category?: string;
  city?: string;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface Statistics {
  ticketsPerMonth: { month: string; count: number }[];
  popularCategories: { category_name: string; count: number }[];
  revenuePerMonth: { month: string; revenue: number }[];
}
