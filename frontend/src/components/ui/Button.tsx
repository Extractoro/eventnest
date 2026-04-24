import { type ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = ({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={[
      styles.btn,
      styles[variant],
      fullWidth ? styles.fullWidth : '',
      className,
    ].join(' ').trim()}
  >
    {loading ? <span className={styles.spinner} /> : children}
  </button>
);
