import { BadRequestError, NotFoundError } from '../../utils/errors';
import { TicketStatus } from '@prisma/client';
import * as adminRepo from './admin.repository';
import * as venueService from '../venues/venues.service';
import * as categoryService from '../categories/categories.service';
import type { z } from 'zod';
import type {
  adminUsersQuerySchema, adminEventsQuerySchema, adminTicketsQuerySchema,
  createVenueSchema, updateVenueSchema, adminUpdateEventSchema,
} from './admin.schema';

type AdminUsersQuery   = z.infer<typeof adminUsersQuerySchema>;
type AdminEventsQuery  = z.infer<typeof adminEventsQuerySchema>;
type AdminTicketsQuery = z.infer<typeof adminTicketsQuerySchema>;
type CreateVenueDto    = z.infer<typeof createVenueSchema>;
type UpdateVenueDto    = z.infer<typeof updateVenueSchema>;
type UpdateEventDto    = z.infer<typeof adminUpdateEventSchema>;

export const getUsers = (query: AdminUsersQuery) =>
  adminRepo.findAllUsers(query.page, query.limit);

export const updateRole = async (userId: number, role: 'user' | 'admin') => {
  const user = await adminRepo.findUserById(userId);
  if (!user) throw new NotFoundError('User not found');
  return adminRepo.updateUserRole(userId, role);
};

export const getStatistics = () => adminRepo.getStatistics();

// ── Events ───────────────────────────────────────────────────────────────────

/**
 * Returns all events (including unavailable) with available_tickets computed.
 */
export const getEvents = (query: AdminEventsQuery) =>
  adminRepo.findAllEvents(query.page, query.limit);

/**
 * Updates editable fields on an event.
 * @throws {NotFoundError} if event does not exist (Prisma propagates P2025)
 */
export const updateEvent = (eventId: number, dto: UpdateEventDto) =>
  adminRepo.updateEvent(eventId, dto);

/**
 * Deletes an event only when it has no active (booked or paid) tickets.
 * @throws {BadRequestError} if active tickets exist
 */
export const deleteEvent = async (eventId: number) => {
  const activeCount = await adminRepo.getActiveTicketCount(eventId);
  if (activeCount > 0) {
    throw new BadRequestError(
      `Cannot delete event: ${activeCount} active ticket(s) exist. Cancel them first.`,
    );
  }
  return adminRepo.deleteEvent(eventId);
};

// ── Venues ───────────────────────────────────────────────────────────────────

export const getVenues   = () => venueService.getAll();
export const createVenue = (dto: CreateVenueDto) => venueService.create(dto);

/**
 * Updates an existing venue.
 * @throws {NotFoundError} if venue does not exist
 * @throws {ConflictError} if the new name is already taken
 */
export const updateVenue = (venueId: number, dto: UpdateVenueDto) =>
  venueService.update(venueId, dto);

/**
 * Deletes a venue.
 * @throws {NotFoundError} if venue does not exist
 */
export const deleteVenue = (venueId: number) => venueService.deleteById(venueId);

// ── Tickets ───────────────────────────────────────────────────────────────────

/**
 * Returns a paginated list of all tickets, optionally filtered by status or search term.
 */
export const getTickets = (query: AdminTicketsQuery) =>
  adminRepo.findAllTickets(query.page, query.limit, query.status as TicketStatus | undefined, query.search);

/**
 * Sets a ticket's status to any valid value.
 * Admin bypass — no business-rule restrictions (e.g. admins can un-cancel a ticket).
 * @throws {NotFoundError} if Prisma raises P2025 (record not found)
 */
export const setTicketStatus = (ticketId: number, status: TicketStatus) =>
  adminRepo.setTicketStatus(ticketId, status);

// ── Categories ───────────────────────────────────────────────────────────────

export const getCategories = () => categoryService.getAll();
