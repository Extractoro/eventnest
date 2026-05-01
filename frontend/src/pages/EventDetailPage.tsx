import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layout } from '../components/layout/Layout';
import { Spinner, ErrorMessage, Button, Modal, Input } from '../components/ui';
import { useEvent } from '../hooks/useEvents';
import { useBookTicket, useMyTickets } from '../hooks/useTickets';
import { useAuthStore } from '../store/auth.store';
import { bookTicketSchema, type BookTicketFormData } from '../schemas/ticket.schema';
import { formatDate, formatPrice } from '../utils/format';
import styles from './EventDetailPage.module.scss';

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, error } = useEvent(Number(id));
  const bookTicket = useBookTicket();
  const { data: myTickets } = useMyTickets();
  const role = useAuthStore(s => s.role);
  const [bookOpen, setBookOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BookTicketFormData>({
    resolver: zodResolver(bookTicketSchema),
    defaultValues: { quantity: 1 },
  });

  const onBook = handleSubmit(d => {
    bookTicket.mutate({ eventId: Number(id), quantity: d.quantity }, {
      onSuccess: () => { setBookOpen(false); reset(); },
    });
  });

  if (isLoading) return <Layout><Spinner centered /></Layout>;
  if (error || !event) return <Layout><ErrorMessage message="Event not found." /></Layout>;

  const maxPerUser   = Math.ceil(event.capacity_event * 0.1);
  const alreadyOwned = myTickets
    ?.filter(t => t.event.event_id === event.event_id && t.ticket_status !== 'cancelled')
    .reduce((sum, t) => sum + t.quantity, 0) ?? 0;
  const remaining = Math.max(0, maxPerUser - alreadyOwned);
  const bookingMax = Math.min(remaining, event.available_tickets);

  return (
    <Layout>
      <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>

      <div className={styles.wrapper}>
        <div className={styles.main}>
          <span className={styles.category}>{event.category.category_name}</span>
          <h1 className={styles.title}>{event.event_name}</h1>
          {event.description && <p className={styles.desc}>{event.description}</p>}

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}><span>📅 Date</span><strong>{formatDate(event.event_date)}</strong></div>
            <div className={styles.infoItem}><span>📍 Venue</span><strong>{event.venue.venue_name}</strong></div>
            <div className={styles.infoItem}><span>🏙 City</span><strong>{event.venue.city}</strong></div>
            <div className={styles.infoItem}><span>📌 Address</span><strong>{event.venue.address}</strong></div>
            <div className={styles.infoItem}><span>🎟 Available</span><strong>{event.available_tickets} tickets</strong></div>
            {event.is_recurring && event.recurringEvent && (
              <div className={styles.infoItem}><span>🔁 Recurring</span><strong>{event.recurringEvent.frequency}</strong></div>
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.priceBox}>
            <p className={styles.priceLabel}>Price per ticket</p>
            <p className={styles.price}>{formatPrice(event.ticket_price)}</p>
            {event.isAvailable && event.available_tickets > 0 ? (
              <>
                {role !== 'admin' && (
                  <Button fullWidth onClick={() => setBookOpen(true)}>Book Tickets</Button>
                )}
                <p className={styles.seats}>{event.available_tickets} seats remaining</p>
              </>
            ) : (
              <p className={styles.soldOut}>Sold Out</p>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={bookOpen} onClose={() => setBookOpen(false)} title="Book Tickets">
        <form onSubmit={onBook} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p>
            <strong>{event.event_name}</strong><br />
            {formatDate(event.event_date)} · {event.venue.city}
          </p>
          <Input
            label={`Quantity (you can book ${remaining} more)`}
            type="number"
            min={1}
            max={bookingMax}
            error={errors.quantity?.message}
            {...register('quantity', { valueAsNumber: true })}
          />
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            Total: {formatPrice(+event.ticket_price)}
          </p>
          <Button type="submit" fullWidth loading={bookTicket.isPending}>Confirm Booking</Button>
        </form>
      </Modal>
    </Layout>
  );
};

export default EventDetailPage;
