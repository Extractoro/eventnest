import { DateTime } from 'luxon';

export const formatDate = (iso: string) =>
  DateTime.fromISO(iso).toFormat('dd MMM yyyy, HH:mm');

export const formatDateShort = (iso: string) =>
  DateTime.fromISO(iso).toFormat('dd MMM yyyy');

export const formatPrice = (price: string | number) =>
  `₴${Number(price).toFixed(2)}`;
