import styles from './ErrorMessage.module.scss';

interface ErrorMessageProps {
  message?: string | null;
}

export const ErrorMessage = ({ message }: ErrorMessageProps) => {
  if (!message) return null;
  return <p className={styles.error} role="alert">{message}</p>;
};
