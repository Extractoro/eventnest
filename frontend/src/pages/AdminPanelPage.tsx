import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '../components/layout/Layout';
import { Button, Input, Modal, Spinner, ErrorMessage } from '../components/ui';
import {
  useAdminEvents, useAdminUpdateEvent, useAdminDeleteEvent,
  useAdminVenues, useAdminCreateVenue, useAdminUpdateVenue, useAdminDeleteVenue,
} from '../hooks/useAdmin';
import { formatDate, formatPrice } from '../utils/format';
import type { Event, Venue } from '../types';
import type { UpdateEventDto } from '../api/admin.api';
import styles from './AdminPanelPage.module.scss';

// ── Zod schemas for edit forms ────────────────────────────────────────────────

const editEventSchema = z.object({
  event_name:     z.string().min(3, 'Min 3 characters').max(100).optional().or(z.literal('')),
  description:    z.string().max(2000).optional().or(z.literal('')),
  ticket_price:   z.number({ error: 'Must be a number' }).positive('Must be positive').optional(),
  capacity_event: z.number({ error: 'Must be a number' }).int().positive('Must be positive').optional(),
  isAvailable:    z.boolean().optional(),
});
type EditEventFormData = z.infer<typeof editEventSchema>;

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

type ActiveTab = 'events' | 'venues';

// ── Events tab ────────────────────────────────────────────────────────────────

const EventsTab = () => {
  const [page, setPage] = useState(1);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const navigate = useNavigate();
  const LIMIT = 20;

  const { data, isLoading, error } = useAdminEvents(page, LIMIT);
  const updateEvent = useAdminUpdateEvent();
  const deleteEvent = useAdminDeleteEvent();

  const form = useForm<EditEventFormData>({ resolver: zodResolver(editEventSchema) });

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    form.reset({
      event_name:     event.event_name,
      description:    event.description ?? '',
      ticket_price:   Number(event.ticket_price),
      capacity_event: event.capacity_event,
      isAvailable:    event.isAvailable,
    });
  };

  const closeEdit = () => {
    setEditingEvent(null);
    form.reset();
  };

  const onSubmitEdit = form.handleSubmit((data: EditEventFormData) => {
    if (!editingEvent) return;
    const payload: UpdateEventDto = {
      ...(data.event_name     && { event_name:     data.event_name }),
      ...(data.description    && { description:    data.description }),
      ...(data.ticket_price   !== undefined && { ticket_price:   data.ticket_price }),
      ...(data.capacity_event !== undefined && { capacity_event: data.capacity_event }),
      ...(data.isAvailable    !== undefined && { isAvailable:    data.isAvailable }),
    };
    updateEvent.mutate({ id: editingEvent.event_id, data: payload }, { onSuccess: closeEdit });
  });

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
                  <Button variant="secondary" className={styles.actionBtn} onClick={() => openEdit(event)}>
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

      <Modal isOpen={!!editingEvent} onClose={closeEdit} title={`Edit: ${editingEvent?.event_name ?? ''}`}>
        <form onSubmit={onSubmitEdit} className={styles.modalForm}>
          <Input label="Event Name" error={form.formState.errors.event_name?.message} {...form.register('event_name')} />
          <Input label="Description" error={form.formState.errors.description?.message} {...form.register('description')} />
          <Input
            label="Ticket Price (₴)"
            type="number"
            step="0.01"
            error={form.formState.errors.ticket_price?.message}
            {...form.register('ticket_price', { valueAsNumber: true })}
          />
          <Input
            label="Capacity"
            type="number"
            error={form.formState.errors.capacity_event?.message}
            {...form.register('capacity_event', { valueAsNumber: true })}
          />
          <label className={styles.checkLabel}>
            <input type="checkbox" {...form.register('isAvailable')} />
            Available for booking
          </label>
          <div className={styles.modalActions}>
            <Button type="button" variant="secondary" onClick={closeEdit}>Cancel</Button>
            <Button type="submit" loading={updateEvent.isPending}>Save</Button>
          </div>
        </form>
      </Modal>
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
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'events' ? <EventsTab /> : <VenuesTab />}
      </div>
    </Layout>
  );
};

export default AdminPanelPage;
