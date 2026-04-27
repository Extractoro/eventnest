import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as adminApi from '../api/admin.api';
import { getErrorMessage } from '../utils/errorMessage';

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
      toast.success('Venue deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};
