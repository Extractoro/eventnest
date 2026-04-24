import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Layout } from '../components/layout/Layout';
import { Spinner, ErrorMessage } from '../components/ui';
import { useStatistics } from '../hooks/useUser';
import styles from './AdminStatisticsPage.module.scss';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const COLORS = [
  '#e94560', '#3b82f6', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

const AdminStatisticsPage = () => {
  const { data, isLoading, error } = useStatistics();

  if (isLoading) return <Layout><Spinner centered /></Layout>;
  if (error || !data) return <Layout><ErrorMessage message="Failed to load statistics." /></Layout>;

  const ticketsData = {
    labels:   data.ticketsPerMonth.map(d => d.month),
    datasets: [{
      label: 'Tickets sold',
      data:  data.ticketsPerMonth.map(d => d.count),
      backgroundColor: '#e94560aa',
      borderColor: '#e94560',
      borderWidth: 2,
    }],
  };

  const revenueData = {
    labels:   data.revenuePerMonth.map(d => d.month),
    datasets: [{
      label: 'Revenue (₴)',
      data:  data.revenuePerMonth.map(d => d.revenue),
      backgroundColor: '#3b82f6aa',
      borderColor: '#3b82f6',
      borderWidth: 2,
    }],
  };

  const categoryData = {
    labels: data.popularCategories.map(d => d.category_name),
    datasets: [{
      data:            data.popularCategories.map(d => d.count),
      backgroundColor: COLORS.slice(0, data.popularCategories.length),
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
  };

  return (
    <Layout>
      <h1 className={styles.heading}>Statistics</h1>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Tickets per Month</h2>
          <Bar data={ticketsData} options={chartOptions} />
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Revenue per Month (₴)</h2>
          <Bar data={revenueData} options={chartOptions} />
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Popular Categories</h2>
          {data.popularCategories.length > 0 ? (
            <div className={styles.pieWrapper}>
              <Pie data={categoryData} />
            </div>
          ) : (
            <p className={styles.empty}>No data yet.</p>
          )}
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Category Breakdown</h2>
          <table className={styles.table}>
            <thead>
              <tr><th>Category</th><th>Tickets</th></tr>
            </thead>
            <tbody>
              {data.popularCategories.map(c => (
                <tr key={c.category_name}>
                  <td>{c.category_name}</td>
                  <td>{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default AdminStatisticsPage;
