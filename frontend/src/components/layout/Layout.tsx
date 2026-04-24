import { type ReactNode } from 'react';
import { Navbar } from './Navbar';
import styles from './Layout.module.scss';

export const Layout = ({ children }: { children: ReactNode }) => (
  <>
    <Navbar />
    <main className={styles.main}>{children}</main>
  </>
);
