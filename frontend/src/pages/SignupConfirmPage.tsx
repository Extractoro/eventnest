import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthCard } from '../components/forms/AuthCard';
import { Spinner } from '../components/ui';
import { apiClient } from '../api/client';
import styles from './AuthPage.module.scss';

const MISSING_TOKEN_MESSAGE = 'Missing verification token.';

const SignupConfirmPage = () => {
  const { token } = useParams<{ token: string }>();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error',
  );
  const [message, setMessage] = useState(token ? '' : MISSING_TOKEN_MESSAGE);

  useEffect(() => {
    if (!token) return;

    apiClient.get(`/auth/verify/${token}`)
      .then(r => { setStatus('success'); setMessage(r.data.message); })
      .catch(e => {
        setStatus('error');
        setMessage(axios.isAxiosError(e) ? e.response?.data?.message : 'Verification failed.');
      });
  }, [token]);

  return (
    <AuthCard title="Email Verification">
      {status === 'loading' && <Spinner centered />}
      {status === 'success' && (
        <div className={styles.successBox}>
          <p>✓ {message}</p>
          <p style={{ marginTop: 12 }}><Link to="/login">Sign in to your account →</Link></p>
        </div>
      )}
      {status === 'error' && (
        <div>
          <p style={{ color: '#dc3545', textAlign: 'center' }}>{message}</p>
          <p className={styles.footer}><Link to="/login">Back to Sign In</Link></p>
        </div>
      )}
    </AuthCard>
  );
};

export default SignupConfirmPage;
