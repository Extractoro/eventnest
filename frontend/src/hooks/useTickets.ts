import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as ticketsApi from '../api/tickets.api';
import { getErrorMessage } from '../utils/errorMessage';

export const useMyTickets = () =>
  useQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketsApi.getMyTickets().then(r => r.data.data!),
  });

export const useBookTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ticketsApi.book,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket booked!');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};

export const usePayTickets = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => ticketsApi.pay(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Payment successful!');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};

export const useCancelTickets = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => ticketsApi.cancel(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      toast.success('Ticket cancelled');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
};
