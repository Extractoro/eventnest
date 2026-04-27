import { useNavigate, useParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import { Layout } from '../components/layout/Layout';
import { Spinner, ErrorMessage } from '../components/ui';
import { EventForm } from '../components/forms/EventForm';
import { useEvent, useUpdateEvent } from '../hooks/useEvents';
import type { CreateEventFormData } from '../schemas/event.schema';
import type { Event } from '../types';
import styles from './AdminAddEventPage.module.scss';

/**
 * Maps a loaded Event API response to the values expected by the event form.
 * Converts ISO date strings to the formats required by datetime-local and date inputs.
 */
const toFormDefaults = (event: Event): CreateEventFormData => ({
  event_name:      event.event_name,
  event_date:      DateTime.fromISO(event.event_date).toFormat("yyyy-MM-dd'T'HH:mm"),
  description:     event.description ?? '',
  ticket_price:    Number(event.ticket_price),
  capacity_event:  event.capacity_event,
  isAvailable:     event.isAvailable,
  venue_name:      event.venue.venue_name,
  address:         event.venue.address,
  city:            event.venue.city,
  capacity:        event.venue.capacity,
  category:        event.category.category_name,
  isRecurring:     event.is_recurring,
  start_date:      event.recurringEvent
    ? DateTime.fromISO(event.recurringEvent.start_date).toFormat('yyyy-MM-dd')
    : '',
  end_date:        event.recurringEvent
    ? DateTime.fromISO(event.recurringEvent.end_date).toFormat('yyyy-MM-dd')
    : '',
  frequency:       event.recurringEvent?.frequency ?? undefined,
  repeat_interval: event.recurringEvent?.repeat_interval ?? 1,
});

const AdminEditEventPage = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventId  = Number(id);

  const { data: event, isLoading, error } = useEvent(eventId);
  const updateEvent = useUpdateEvent(eventId);

  if (isLoading) return <Layout><Spinner centered /></Layout>;
  if (error || !event) return <Layout><ErrorMessage message="Failed to load event." /></Layout>;

  return (
    <Layout>
      <h1 className={styles.heading}>Edit Event</h1>
      <EventForm
        mode="edit"
        defaultValues={toFormDefaults(event)}
        onSubmit={data => updateEvent.mutate(data, { onSuccess: () => navigate('/admin/panel') })}
        isPending={updateEvent.isPending}
        onCancel={() => navigate('/admin/panel')}
      />
    </Layout>
  );
};

export default AdminEditEventPage;
