import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/ui.store';
import { useLogout } from '../../hooks/useAuth';
import styles from './Navbar.module.scss';

export const Navbar = () => {
  const { isAuthenticated, role } = useAuthStore();
  const { theme, toggleTheme }    = useUiStore();
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>EventNest</Link>

        <nav className={styles.nav}>
          {isAuthenticated ? (
            <>
              <Link to="/" className={styles.link}>Events</Link>
              <Link to="/tickets" className={styles.link}>My Tickets</Link>
              <Link to="/profile" className={styles.link}>Profile</Link>
              {role === 'admin' && (
                <>
                  <Link to="/admin/events/new" className={styles.link}>Add Event</Link>
                  <Link to="/admin/statistics" className={styles.link}>Statistics</Link>
                  <Link to="/admin/users" className={styles.link}>Users</Link>
                </>
              )}
              <button
                className={styles.btn}
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button className={styles.btn} onClick={() => navigate('/login')}>Sign In</button>
              <button className={`${styles.btn} ${styles.primary}`} onClick={() => navigate('/register')}>Sign Up</button>
            </>
          )}
          <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </nav>
      </div>
    </header>
  );
};
