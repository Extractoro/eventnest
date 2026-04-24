import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { AuthCard } from '../components/forms/AuthCard';
import { Input, Button } from '../components/ui';
import { forgotPasswordSchema, type ForgotPasswordData } from '../schemas/auth.schema';
import { useForgotPassword } from '../hooks/useAuth';
import styles from './AuthPage.module.scss';

const ForgotPasswordPage = () => {
  const forgot = useForgotPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  return (
    <AuthCard title="Forgot Password">
      {forgot.isSuccess ? (
        <div className={styles.successBox}>
          If that email is registered, a reset link has been sent. Check your inbox.
        </div>
      ) : (
        <form onSubmit={handleSubmit(d => forgot.mutate(d.email))} className={styles.form}>
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Button type="submit" fullWidth loading={forgot.isPending}>Send Reset Link</Button>
        </form>
      )}
      <p className={styles.footer}><Link to="/login">← Back to Sign In</Link></p>
    </AuthCard>
  );
};

export default ForgotPasswordPage;
