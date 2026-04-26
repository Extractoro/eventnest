import { describe, it, expect } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import LoginPage from './LoginPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { server } from '../test/server';

const renderLoginPage = () =>
  renderWithProviders(<LoginPage />, { initialEntries: ['/login'] });

/** Submits the form by firing a submit event on the form element directly. */
const submitForm = () => {
  const button = screen.getByRole('button', { name: /sign in/i });
  const form = button.closest('form');
  if (form) fireEvent.submit(form);
};

describe('LoginPage', () => {
  it('renders the sign-in form fields', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows a validation error when email is invalid', async () => {
    renderLoginPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    submitForm();

    await waitFor(
      () => expect(screen.getByText(/invalid email/i)).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it('shows a validation error when password is empty', async () => {
    renderLoginPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    submitForm();

    await waitFor(
      () => expect(screen.getByText(/password is required/i)).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it('calls the login API when form is valid', async () => {
    let apiCalled = false;
    server.use(
      http.post('http://localhost:8080/auth/login', () => {
        apiCalled = true;
        return HttpResponse.json({
          success: true,
          message: 'Logged in',
          data: { accessToken: 'token', role: 'user', userId: 1 },
        });
      }),
    );

    renderLoginPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password1');
    submitForm();

    await waitFor(() => expect(apiCalled).toBe(true), { timeout: 3000 });
  });

  it('does not call the login API when validation fails (invalid email)', async () => {
    let apiCalled = false;
    server.use(
      http.post('http://localhost:8080/auth/login', () => {
        apiCalled = true;
        return HttpResponse.json({ success: true, message: 'Logged in', data: {} });
      }),
    );

    renderLoginPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    submitForm();

    await new Promise(r => setTimeout(r, 200));
    expect(apiCalled).toBe(false);
  });

  it('renders a link to the registration page', () => {
    renderLoginPage();
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/register');
  });

  it('renders a link to the forgot-password page', () => {
    renderLoginPage();
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });
});
