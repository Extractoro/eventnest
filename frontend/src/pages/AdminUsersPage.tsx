import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Spinner, ErrorMessage, Button } from '../components/ui';
import { useAdminUsers, useUpdateRole } from '../hooks/useUser';
import { formatDateShort } from '../utils/format';
import styles from './AdminUsersPage.module.scss';

const AdminUsersPage = () => {
  const [page, setPage] = useState(1);
  const LIMIT = 20;
  const { data, isLoading, error } = useAdminUsers(page, LIMIT);
  const updateRole = useUpdateRole();

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  return (
    <Layout>
      <h1 className={styles.heading}>Users</h1>

      {isLoading && <Spinner centered />}
      {error     && <ErrorMessage message="Failed to load users." />}

      {data && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map(user => (
                  <tr key={user.user_id}>
                    <td>#{user.user_id}</td>
                    <td>{user.user_firstname} {user.user_lastname}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`${styles.badge} ${user.role === 'admin' ? styles.admin : styles.user}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.verify ? '✓' : '✗'}</td>
                    <td>{formatDateShort(user.created_at)}</td>
                    <td>
                      <Button
                        variant="secondary"
                        loading={updateRole.isPending}
                        onClick={() => updateRole.mutate({
                          userId: user.user_id,
                          role: user.role === 'admin' ? 'user' : 'admin',
                        })}
                        className={styles.roleBtn}
                      >
                        {user.role === 'admin' ? 'Demote' : 'Promote'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default AdminUsersPage;
