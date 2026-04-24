import { Link } from 'react-router-dom';
import type { Event } from '../../types';
import { formatDate, formatPrice } from '../../utils/format';
import styles from './EventCard.module.scss';

export const EventCard = ({ event }: { event: Event }) => (
  <Link to={`/events/${event.event_id}`} className={styles.card}>
    <div className={styles.category}>{event.category.category_name}</div>
    <h3 className={styles.name}>{event.event_name}</h3>
    <p className={styles.meta}>
      📅 {formatDate(event.event_date)}
    </p>
    <p className={styles.meta}>
      📍 {event.venue.venue_name}, {event.venue.city}
    </p>
    <div className={styles.footer}>
      <span className={styles.price}>{formatPrice(event.ticket_price)}</span>
      <span className={event.available_tickets > 0 ? styles.available : styles.sold}>
        {event.available_tickets > 0 ? `${event.available_tickets} left` : 'Sold out'}
      </span>
    </div>
  </Link>
);
