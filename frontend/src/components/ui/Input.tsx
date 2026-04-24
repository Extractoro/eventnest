import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './Input.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className={styles.wrapper}>
        {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
        <input
          {...rest}
          id={inputId}
          ref={ref}
          className={[styles.input, error ? styles.hasError : '', className].join(' ').trim()}
        />
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
