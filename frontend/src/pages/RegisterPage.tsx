import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { AuthCard } from '../components/forms/AuthCard';
import { Input, Button } from '../components/ui';
import { registerSchema, type RegisterFormData } from '../schemas/auth.schema';
import { useRegister } from '../hooks/useAuth';
import styles from './AuthPage.module.scss';

const RegisterPage = () => {
  const reg = useRegister();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  return (
    <AuthCard title="Create Account">
      <form onSubmit={handleSubmit(d => reg.mutate(d))} className={styles.form}>
        <Input label="First Name" error={errors.firstName?.message} {...register('firstName')} />
        <Input label="Last Name"  error={errors.lastName?.message}  {...register('lastName')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
        <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
        <Button type="submit" fullWidth loading={reg.isPending}>Create Account</Button>
      </form>
      <p className={styles.footer}>
        Already have an account? <Link to="/login">Sign In</Link>
      </p>
    </AuthCard>
  );
};

export default RegisterPage;
