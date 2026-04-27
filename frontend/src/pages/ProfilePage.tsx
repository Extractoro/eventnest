import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Input, Button, Spinner, ErrorMessage } from '../components/ui';
import { useProfile, useUpdateProfile, useChangePassword } from '../hooks/useUser';
import {
  updateProfileSchema, changePasswordSchema,
  type UpdateProfileFormData, type ChangePasswordData,
} from '../schemas/auth.schema';
import styles from './ProfilePage.module.scss';

const ProfilePage = () => {
  const { data: user, isLoading, error } = useProfile();
  const updateProfile  = useUpdateProfile();
  const changePassword = useChangePassword();

  const profileForm = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
  });
  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.user_firstname,
        lastName:  user.user_lastname,
        phone:     user.phone ?? '',
      });
    }
  }, [user]); // eslint-disable-line

  if (isLoading) return <Layout><Spinner centered /></Layout>;
  if (error)     return <Layout><ErrorMessage message="Failed to load profile." /></Layout>;

  return (
    <Layout>
      <h1 className={styles.heading}>My Profile</h1>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Personal Information</h2>
          <p className={styles.email}>{user?.email}</p>
          <form
            onSubmit={profileForm.handleSubmit(d => updateProfile.mutate({
              firstName: d.firstName || undefined,
              lastName:  d.lastName  || undefined,
              phone:     d.phone     || undefined,
            }))}
            className={styles.form}
          >
            <Input
              label="First Name"
              error={profileForm.formState.errors.firstName?.message}
              {...profileForm.register('firstName')}
            />
            <Input
              label="Last Name"
              error={profileForm.formState.errors.lastName?.message}
              {...profileForm.register('lastName')}
            />
            <Input
              label="Phone"
              type="tel"
              error={profileForm.formState.errors.phone?.message}
              {...profileForm.register('phone')}
            />
            <Button
              type="submit"
              loading={updateProfile.isPending}
              disabled={!profileForm.formState.isDirty || !profileForm.formState.isValid}
            >
              Save Changes
            </Button>
          </form>
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Change Password</h2>
          <form
            onSubmit={passwordForm.handleSubmit(d => changePassword.mutate(
              { currentPassword: d.currentPassword, newPassword: d.newPassword },
              { onSuccess: () => passwordForm.reset() },
            ))}
            className={styles.form}
          >
            <Input
              label="Current Password"
              type="password"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword')}
            />
            <Input
              label="New Password"
              type="password"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword')}
            />
            <Input
              label="Confirm New Password"
              type="password"
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register('confirmPassword')}
            />
            <Button type="submit" loading={changePassword.isPending}>Change Password</Button>
          </form>
        </section>
      </div>
    </Layout>
  );
};

export default ProfilePage;
