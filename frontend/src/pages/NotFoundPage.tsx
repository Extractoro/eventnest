import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.scss';

const NotFoundPage = () => (
  <div className={styles.wrapper}>
    <h1 className={styles.code}>404</h1>
    <p className={styles.msg}>Page not found</p>
    <Link to="/" className={styles.link}>← Back to Events</Link>
  </div>
);

export default NotFoundPage;
