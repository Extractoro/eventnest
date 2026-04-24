import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { AuthCard } from '../components/forms/AuthCard';
import { Input, Button } from '../components/ui';
import { loginSchema, type LoginFormData } from '../schemas/auth.schema';
import { useLogin } from '../hooks/useAuth';
import styles from './AuthPage.module.scss';

const LoginPage = () => {
  const login = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <AuthCard title="Sign In">
      <form onSubmit={handleSubmit(d => login.mutate(d))} className={styles.form}>
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
        <Link to="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
        <Button type="submit" fullWidth loading={login.isPending}>Sign In</Button>
      </form>
      <p className={styles.footer}>
        Don't have an account? <Link to="/register">Sign Up</Link>
      </p>
    </AuthCard>
  );
};

export default LoginPage;
