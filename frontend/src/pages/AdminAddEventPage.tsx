import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Input, Button } from '../components/ui';
import { createEventSchema, type CreateEventFormData } from '../schemas/event.schema';
import { useCreateEvent } from '../hooks/useEvents';
import styles from './AdminAddEventPage.module.scss';

const CATEGORIES = ['Concert', 'Theatre', 'Sport', 'Festival', 'Exhibition', 'Other'];
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'] as const;

const AdminAddEventPage = () => {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();

  const { register, handleSubmit, control, formState: { errors } } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { isAvailable: true, isRecurring: false, repeat_interval: 1, ticket_price: 0, capacity_event: 0, capacity: 0 },
  });

  const isRecurring = useWatch({ control, name: 'isRecurring' });

  const onSubmit = handleSubmit(data => {
    createEvent.mutate(data, {
      onSuccess: () => navigate('/'),
    });
  });

  return (
    <Layout>
      <h1 className={styles.heading}>Create Event</h1>
      <form onSubmit={onSubmit} className={styles.form}>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Event Details</h2>
          <div className={styles.grid2}>
            <Input label="Event Name" error={errors.event_name?.message} {...register('event_name')} />
            <Input label="Date & Time" type="datetime-local" error={errors.event_date?.message} {...register('event_date')} />
          </div>
          <div className={styles.grid2}>
            <Input label="Ticket Price (₴)" type="number" step="0.01" error={errors.ticket_price?.message} {...register('ticket_price', { valueAsNumber: true })} />
            <Input label="Event Capacity" type="number" error={errors.capacity_event?.message} {...register('capacity_event', { valueAsNumber: true })} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <select className={styles.select} {...register('category')}>
              <option value="">— Select —</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className={styles.fieldError}>{errors.category.message}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description (optional)</label>
            <textarea className={styles.textarea} rows={4} {...register('description')} />
          </div>

          <label className={styles.checkLabel}>
            <input type="checkbox" {...register('isAvailable')} />
            Available for booking
          </label>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Venue</h2>
          <div className={styles.grid2}>
            <Input label="Venue Name" error={errors.venue_name?.message} {...register('venue_name')} />
            <Input label="City" error={errors.city?.message} {...register('city')} />
          </div>
          <div className={styles.grid2}>
            <Input label="Address" error={errors.address?.message} {...register('address')} />
            <Input label="Venue Capacity" type="number" error={errors.capacity?.message} {...register('capacity', { valueAsNumber: true })} />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recurring</h2>
          <label className={styles.checkLabel}>
            <input type="checkbox" {...register('isRecurring')} />
            This is a recurring event
          </label>

          {isRecurring && (
            <div className={styles.recurringFields}>
              <div className={styles.grid2}>
                <Input label="Start Date" type="date" error={errors.start_date?.message} {...register('start_date')} />
                <Input label="End Date" type="date" error={errors.end_date?.message} {...register('end_date')} />
              </div>
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label className={styles.label}>Frequency</label>
                  <select className={styles.select} {...register('frequency')}>
                    <option value="">— Select —</option>
                    {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  {errors.frequency && <p className={styles.fieldError}>{errors.frequency.message}</p>}
                </div>
                <Input label="Repeat Every (n)" type="number" min={1} error={errors.repeat_interval?.message} {...register('repeat_interval', { valueAsNumber: true })} />
              </div>
            </div>
          )}
        </section>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={createEvent.isPending}>Create Event</Button>
        </div>
      </form>
    </Layout>
  );
};

export default AdminAddEventPage;
