import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { EventForm } from '../components/forms/EventForm';
import { useCreateEvent } from '../hooks/useEvents';
import styles from './AdminAddEventPage.module.scss';

const AdminAddEventPage = () => {
  const navigate    = useNavigate();
  const createEvent = useCreateEvent();

  return (
    <Layout>
      <h1 className={styles.heading}>Create Event</h1>
      <EventForm
        mode="create"
        onSubmit={data => createEvent.mutate(data, { onSuccess: () => navigate('/admin/panel') })}
        isPending={createEvent.isPending}
        onCancel={() => navigate(-1)}
      />
    </Layout>
  );
};

export default AdminAddEventPage;
