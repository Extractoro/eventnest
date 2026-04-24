import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { EventFiltersBar } from '../components/events/EventFilters';
import { EventCard } from '../components/events/EventCard';
import { Spinner, ErrorMessage, Button } from '../components/ui';
import { useEvents } from '../hooks/useEvents';
import type { EventFilters } from '../types';
import styles from './HomePage.module.scss';

const LIMIT = 12;

const HomePage = () => {
  const [filters, setFilters] = useState<EventFilters>({ page: 1, limit: LIMIT });
  const { data, isLoading, error } = useEvents(filters);

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;
  const page = filters.page ?? 1;

  return (
    <Layout>
      <h1 className={styles.heading}>Upcoming Events</h1>
      <EventFiltersBar filters={filters} onChange={f => setFilters({ ...f, limit: LIMIT })} />

      {isLoading && <Spinner centered />}
      {error   && <ErrorMessage message="Failed to load events." />}

      {data && (
        <>
          <div className={styles.grid}>
            {data.data.map(event => <EventCard key={event.event_id} event={event} />)}
          </div>
          {data.data.length === 0 && (
            <p className={styles.empty}>No events found. Try different filters.</p>
          )}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
              >
                ← Prev
              </Button>
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default HomePage;
