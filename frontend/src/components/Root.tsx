import { ToastContainer } from 'react-toastify';
import { AppRouter } from '../router';
import { useTheme } from '../hooks/useTheme';

export const Root = () => {
  useTheme();
  return (
    <>
      <AppRouter />
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </>
  );
};
