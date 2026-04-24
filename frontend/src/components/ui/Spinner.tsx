import styles from './Spinner.module.scss';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  centered?: boolean;
}

export const Spinner = ({ size = 'md', centered = false }: SpinnerProps) => (
  <div className={centered ? styles.centered : undefined}>
    <span className={[styles.spinner, styles[size]].join(' ')} />
  </div>
);
