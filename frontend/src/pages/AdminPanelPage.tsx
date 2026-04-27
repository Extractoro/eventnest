import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '../components/layout/Layout';
import { Button, Input, Modal, Spinner, ErrorMessage } from '../components/ui';
import {
  useAdminEvents, useAdminDeleteEvent,
  useAdminVenues, useAdminCreateVenue, useAdminUpdateVenue, useAdminDeleteVenue,
  useAdminTickets, useAdminSetTicketStatus,
} from '../hooks/useAdmin';
import { formatDate, formatPrice } from '../utils/format';
import type { Event, Venue, TicketStatus } from '../types';
import styles from './AdminPanelPage.module.scss';

// ── Zod schemas for edit forms ────────────────────────────────────────────────

const editVenueSchema = z.object({
  venue_name: z.string().min(2, 'Min 2 characters').max(100).optional().or(z.literal('')),
  address:    z.string().min(5, 'Min 5 characters').max(255).optional().or(z.literal('')),
  city:       z.string().min(2, 'Min 2 characters').max(50).optional().or(z.literal('')),
  capacity:   z.number({ error: 'Must be a number' }).int().positive('Must be positive').optional(),
});
type EditVenueFormData = z.infer<typeof editVenueSchema>;

const createVenueSchema = z.object({
  venue_name: z.string().min(2, 'Min 2 characters').max(100),
  address:    z.string().min(5, 'Min 5 characters').max(255),
  city:       z.string().min(2, 'Min 2 characters').max(50),
  capacity:   z.number({ error: 'Must be a number' }).int().positive('Must be positive'),
});
type CreateVenueFormData = z.infer<typeof createVenueSchema>;

// ── Tab type ──────────────────────────────────────────────────────────────────

type ActiveTab = 'events' | 'venues' | 'tickets';

// ── Events tab ────────────────────────────────────────────────────────────────

const EventsTab = () => {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const LIMIT = 20;

  const { data, isLoading, error } = useAdminEvents(page, LIMIT);
  const deleteEvent = useAdminDeleteEvent();

  const confirmDelete = (event: Event) => {
    if (!window.confirm(`Delete "${event.event_name}"? This cannot be undone.`)) return;
    deleteEvent.mutate(event.event_id);
  };

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  if (isLoading) return <Spinner centered />;
  if (error) return <ErrorMessage message="Failed to load events." />;

  return (
    <>
      <div className={styles.toolbar}>
        <Button onClick={() => navigate('/admin/events/new')}>+ Add Event</Button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Date</th>
              <th>Price</th>
              <th>Capacity</th>
              <th>Available</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map(event => (
              <tr key={event.event_id}>
                <td>{event.event_name}</td>
                <td>{formatDate(event.event_date)}</td>
                <td>{formatPrice(event.ticket_price)}</td>
                <td>{event.capacity_event}</td>
                <td>{event.available_tickets}</td>
                <td>
                  <span className={`${styles.badge} ${event.isAvailable ? styles.available : styles.unavailable}`}>
                    {event.isAvailable ? 'Open' : 'Closed'}
                  </span>
                </td>
                <td className={styles.actions}>
                  <Button variant="secondary" className={styles.actionBtn} onClick={() => navigate(`/admin/events/${event.event_id}/edit`)}>
                    Edit
                  </Button>
                  <Button variant="danger" className={styles.actionBtn} onClick={() => confirmDelete(event)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
          <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </div>
      )}
    </>
  );
};

// ── Venues tab ────────────────────────────────────────────────────────────────

const VenuesTab = () => {
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [showCreate, setShowCreate]     = useState(false);

  const { data: venues, isLoading, error } = useAdminVenues();
  const createVenue = useAdminCreateVenue();
  const updateVenue = useAdminUpdateVenue();
  const deleteVenue = useAdminDeleteVenue();

  const editForm   = useForm<EditVenueFormData>({   resolver: zodResolver(editVenueSchema) });
  const createForm = useForm<CreateVenueFormData>({ resolver: zodResolver(createVenueSchema) });

  const openEdit = (venue: Venue) => {
    setEditingVenue(venue);
    editForm.reset({
      venue_name: venue.venue_name,
      address:    venue.address,
      city:       venue.city,
      capacity:   venue.capacity,
    });
  };

  const closeEdit = () => {
    setEditingVenue(null);
    editForm.reset();
  };

  const onSubmitEdit = editForm.handleSubmit((data: EditVenueFormData) => {
    if (!editingVenue) return;
    updateVenue.mutate({ id: editingVenue.venue_id, data }, { onSuccess: closeEdit });
  });

  const onSubmitCreate = createForm.handleSubmit((data: CreateVenueFormData) => {
    createVenue.mutate(data, {
      onSuccess: () => {
        createForm.reset();
        setShowCreate(false);
      },
    });
  });

  const confirmDelete = (venue: Venue) => {
    if (!window.confirm(`Delete venue "${venue.venue_name}"?`)) return;
    deleteVenue.mutate(venue.venue_id);
  };

  if (isLoading) return <Spinner centered />;
  if (error) return <ErrorMessage message="Failed to load venues." />;

  return (
    <>
      <div className={styles.toolbar}>
        <Button onClick={() => setShowCreate(true)}>+ Add Venue</Button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Address</th>
              <th>Capacity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {venues?.map(venue => (
              <tr key={venue.venue_id}>
                <td>{venue.venue_name}</td>
                <td>{venue.city}</td>
                <td>{venue.address}</td>
                <td>{venue.capacity}</td>
                <td className={styles.actions}>
                  <Button variant="secondary" className={styles.actionBtn} onClick={() => openEdit(venue)}>
                    Edit
                  </Button>
                  <Button variant="danger" className={styles.actionBtn} onClick={() => confirmDelete(venue)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!editingVenue} onClose={closeEdit} title={`Edit: ${editingVenue?.venue_name ?? ''}`}>
        <form onSubmit={onSubmitEdit} className={styles.modalForm}>
          <Input label="Venue Name" error={editForm.formState.errors.venue_name?.message} {...editForm.register('venue_name')} />
          <Input label="City"       error={editForm.formState.errors.city?.message}       {...editForm.register('city')} />
          <Input label="Address"    error={editForm.formState.errors.address?.message}    {...editForm.register('address')} />
          <Input
            label="Capacity"
            type="number"
            error={editForm.formState.errors.capacity?.message}
            {...editForm.register('capacity', { valueAsNumber: true })}
          />
          <div className={styles.modalActions}>
            <Button type="button" variant="secondary" onClick={closeEdit}>Cancel</Button>
            <Button type="submit" loading={updateVenue.isPending}>Save</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add New Venue">
        <form onSubmit={onSubmitCreate} className={styles.modalForm}>
          <Input label="Venue Name" error={createForm.formState.errors.venue_name?.message} {...createForm.register('venue_name')} />
          <Input label="City"       error={createForm.formState.errors.city?.message}       {...createForm.register('city')} />
          <Input label="Address"    error={createForm.formState.errors.address?.message}    {...createForm.register('address')} />
          <Input
            label="Capacity"
            type="number"
            error={createForm.formState.errors.capacity?.message}
            {...createForm.register('capacity', { valueAsNumber: true })}
          />
          <div className={styles.modalActions}>
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={createVenue.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

// ── Tickets tab ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<TicketStatus, string> = {
  booked:    'Booked',
  paid:      'Paid',
  cancelled: 'Cancelled',
};

/** Actions available per status: maps current status → list of statuses the admin can switch to. */
const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  booked:    ['paid', 'cancelled'],
  paid:      ['booked', 'cancelled'],
  cancelled: ['booked'],
};

const TicketsTab = () => {
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const LIMIT = 20;

  const { data, isLoading, error } = useAdminTickets(
    page, LIMIT,
    statusFilter || undefined,
    search       || undefined,
  );
  const setStatus = useAdminSetTicketStatus();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as TicketStatus | '');
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  if (isLoading) return <Spinner centered />;
  if (error)     return <ErrorMessage message="Failed to load tickets." />;

  return (
    <>
      <div className={styles.toolbarRow}>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search by user email or event name…"
            value={search}
            onChange={handleSearch}
          />
          <select value={statusFilter} onChange={handleStatusFilter}>
            <option value="">All statuses</option>
            {(Object.keys(STATUS_LABELS) as TicketStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Event</th>
              <th>Date</th>
              <th>Qty</th>
              <th>Price paid</th>
              <th>Purchased</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map(ticket => (
              <tr key={ticket.ticket_id}>
                <td>{ticket.ticket_id}</td>
                <td>
                  {ticket.user.user_firstname} {ticket.user.user_lastname}
                  <br />
                  <small style={{ color: '#6b7280' }}>{ticket.user.email}</small>
                </td>
                <td>{ticket.event.event_name}</td>
                <td>{formatDate(ticket.event.event_date)}</td>
                <td>{ticket.quantity}</td>
                <td>{formatPrice(Number(ticket.price_at_purchase) * ticket.quantity)}</td>
                <td>{formatDate(ticket.purchase_date)}</td>
                <td>
                  <span className={`${styles.badge} ${styles[ticket.ticket_status]}`}>
                    {STATUS_LABELS[ticket.ticket_status]}
                  </span>
                </td>
                <td className={styles.actions}>
                  {STATUS_TRANSITIONS[ticket.ticket_status].map(nextStatus => (
                    <Button
                      key={nextStatus}
                      variant={nextStatus === 'cancelled' ? 'danger' : 'secondary'}
                      className={styles.actionBtn}
                      loading={setStatus.isPending}
                      onClick={() => setStatus.mutate({ ticketId: ticket.ticket_id, status: nextStatus })}
                    >
                      {STATUS_LABELS[nextStatus]}
                    </Button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
          <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </div>
      )}
    </>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const AdminPanelPage = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('events');

  return (
    <Layout>
      <h1 className={styles.heading}>Admin Panel</h1>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'events' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'venues' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('venues')}
        >
          Venues
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'tickets' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          Tickets
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'events'  && <EventsTab />}
        {activeTab === 'venues'  && <VenuesTab />}
        {activeTab === 'tickets' && <TicketsTab />}
      </div>
    </Layout>
  );
};

export default AdminPanelPage;
