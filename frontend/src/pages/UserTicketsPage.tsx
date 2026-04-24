import { Layout } from '../components/layout/Layout';
import { Spinner, ErrorMessage, Button } from '../components/ui';
import { useMyTickets, usePayTickets, useCancelTickets } from '../hooks/useTickets';
import { formatDate, formatPrice } from '../utils/format';
import type { Ticket } from '../types';
import styles from './UserTicketsPage.module.scss';

const statusLabel: Record<string, string> = { booked: 'Booked', paid: 'Paid', cancelled: 'Cancelled' };
const statusClass: Record<string, string> = { booked: 'booked', paid: 'paid', cancelled: 'cancelled' };

const TicketRow = ({ ticket }: { ticket: Ticket }) => {
  const pay    = usePayTickets();
  const cancel = useCancelTickets();

  return (
    <div className={styles.ticket}>
      <div className={styles.info}>
        <h3 className={styles.name}>{ticket.event.event_name}</h3>
        <p className={styles.meta}>📅 {formatDate(ticket.event.event_date)}</p>
        <p className={styles.meta}>📍 {ticket.event.venue.venue_name}, {ticket.event.venue.city}</p>
        <p className={styles.meta}>🎟 ×{ticket.quantity} · {formatPrice(ticket.price_at_purchase)} each</p>
        <p className={styles.meta}>Booked on {formatDate(ticket.purchase_date)}</p>
      </div>
      <div className={styles.actions}>
        <span className={`${styles.status} ${styles[statusClass[ticket.ticket_status]]}`}>
          {statusLabel[ticket.ticket_status]}
        </span>
        <div className={styles.btns}>
          {ticket.ticket_status === 'booked' && (
            <>
              <Button
                variant="primary"
                loading={pay.isPending}
                onClick={() => pay.mutate([ticket.ticket_id])}
              >
                Pay
              </Button>
              <Button
                variant="secondary"
                loading={cancel.isPending}
                onClick={() => cancel.mutate([ticket.ticket_id])}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const UserTicketsPage = () => {
  const { data: tickets, isLoading, error } = useMyTickets();

  return (
    <Layout>
      <h1 className={styles.heading}>My Tickets</h1>
      {isLoading && <Spinner centered />}
      {error     && <ErrorMessage message="Failed to load tickets." />}
      {tickets && tickets.length === 0 && (
        <p className={styles.empty}>You haven't booked any tickets yet.</p>
      )}
      <div className={styles.list}>
        {tickets?.map(t => <TicketRow key={t.ticket_id} ticket={t} />)}
      </div>
    </Layout>
  );
};

export default UserTicketsPage;
