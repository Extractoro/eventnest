import { type ReactNode } from 'react';
import styles from './AuthCard.module.scss';

export const AuthCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className={styles.wrapper}>
    <div className={styles.card}>
      <h1 className={styles.title}>{title}</h1>
      {children}
    </div>
  </div>
);
