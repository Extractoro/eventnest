import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as adminApi from '../api/admin.api';
import { getErrorMessage } from '../utils/errorMessage';
import type { TicketStatus } from '../types';

// ── Events ───────────────────────────────────────────────────────────────────

export const useAdminEvents = (page: number, limit: number) =>
  useQuery({
    queryKey: ['admin-events', page, limit],
    queryFn: () => adminApi.getEvents(page, limit).then(r => r.data.data!),
  });

export const useAdminUpdateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: adminApi.UpdateEventDto }) =>
      adminApi.updateEvent(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};

export const useAdminDeleteEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};

// ── Venues ───────────────────────────────────────────────────────────────────

export const useAdminVenues = () =>
  useQuery({
    queryKey: ['admin-venues'],
    queryFn: () => adminApi.getVenues().then(r => r.data.data!),
  });

export const useAdminCreateVenue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createVenue,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-venues'] });
      toast.success('Venue created');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};

export const useAdminUpdateVenue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof adminApi.updateVenue>[1] }) =>
      adminApi.updateVenue(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-venues'] });
      // Venue data is embedded in every event response, so stale event caches
      // would show outdated venue names/capacity after an edit.
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event'] });
      toast.success('Venue updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};

export const useAdminDeleteVenue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteVenue,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-venues'] });
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event'] });
      toast.success('Venue deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};

// ── Tickets ───────────────────────────────────────────────────────────────────

export const useAdminTickets = (page: number, limit: number, status?: TicketStatus, search?: string) =>
  useQuery({
    queryKey: ['admin-tickets', page, limit, status, search],
    queryFn:  () => adminApi.getTickets(page, limit, status, search).then(r => r.data.data!),
  });

export const useAdminSetTicketStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: number; status: TicketStatus }) =>
      adminApi.setTicketStatus(ticketId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tickets'] });
      // available_tickets counters change in both admin and public event views.
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event'] });
      toast.success('Ticket status updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};
