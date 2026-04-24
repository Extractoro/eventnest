import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from 'react-router-dom';
import { AuthCard } from '../components/forms/AuthCard';
import { Input, Button } from '../components/ui';
import { resetPasswordSchema, type ResetPasswordData } from '../schemas/auth.schema';
import { useResetPassword } from '../hooks/useAuth';
import styles from './AuthPage.module.scss';

const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const reset = useResetPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  return (
    <AuthCard title="Reset Password">
      <form
        onSubmit={handleSubmit(d => reset.mutate({ token: token!, newPassword: d.newPassword }))}
        className={styles.form}
      >
        <Input label="New Password" type="password" error={errors.newPassword?.message} {...register('newPassword')} />
        <Input label="Confirm Password" type="password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" fullWidth loading={reset.isPending}>Reset Password</Button>
      </form>
    </AuthCard>
  );
};

export default ResetPasswordPage;
