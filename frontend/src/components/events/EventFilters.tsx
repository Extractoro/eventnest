import { useState } from 'react';
import { Button } from '../ui';
import type { EventFilters } from '../../types';
import styles from './EventFilters.module.scss';

const CATEGORIES = ['Concert', 'Theatre', 'Sport', 'Festival', 'Exhibition', 'Other'];

interface Props {
  filters: EventFilters;
  onChange: (f: EventFilters) => void;
}

export const EventFiltersBar = ({ filters, onChange }: Props) => {
  const [local, setLocal] = useState<EventFilters>(filters);

  const set = (key: keyof EventFilters, value: string) =>
    setLocal(f => ({ ...f, [key]: value || undefined, page: 1 }));

  const apply = () => onChange({ ...local, page: 1 });
  const reset = () => { setLocal({}); onChange({}); };

  return (
    <div className={styles.bar}>
      <input
        className={styles.search}
        placeholder="Search events…"
        value={local.search ?? ''}
        onChange={e => set('search', e.target.value)}
        onKeyDown={e => e.key === 'Enter' && apply()}
      />

      <select
        className={styles.select}
        value={local.category ?? ''}
        onChange={e => set('category', e.target.value)}
      >
        <option value="">All Categories</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <input
        className={styles.input}
        placeholder="City"
        value={local.city ?? ''}
        onChange={e => set('city', e.target.value)}
      />

      <input
        type="date"
        className={styles.input}
        value={local.date ?? ''}
        onChange={e => set('date', e.target.value)}
      />

      <Button onClick={apply}>Search</Button>
      <Button variant="secondary" onClick={reset}>Reset</Button>
    </div>
  );
};
