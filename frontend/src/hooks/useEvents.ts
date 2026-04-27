import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as eventsApi from '../api/events.api';
import { getErrorMessage } from '../utils/errorMessage';
import type { EventFilters } from '../types';

export const useEvents = (filters: EventFilters = {}) =>
  useQuery({
    queryKey: ['events', filters],
    queryFn: () => eventsApi.getAll(filters).then(r => r.data.data!),
    staleTime: 5 * 60 * 1000,
  });

export const useEvent = (id: number) =>
  useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getById(id).then(r => r.data.data!),
    enabled: !!id,
  });

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      // Creating an event may also create a new venue on the backend,
      // so bust both admin caches so the panel reflects the changes.
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['admin-venues'] });
      toast.success('Event created');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};

export const useUpdateEvent = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => eventsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event', id] });
      // Editing an event may swap or create a venue, so refresh admin caches.
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['admin-venues'] });
      toast.success('Event updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};

export const useDeleteEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eventsApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};
