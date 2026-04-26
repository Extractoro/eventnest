import { describe, it, expect } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import RegisterPage from './RegisterPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { server } from '../test/server';

const renderRegisterPage = () =>
  renderWithProviders(<RegisterPage />, { initialEntries: ['/register'] });

/** Submits the form directly via a form submit event (synchronous, avoids RHF timing issues). */
const submitForm = () => {
  const button = screen.getByRole('button', { name: /create account/i });
  const form = button.closest('form');
  if (form) fireEvent.submit(form);
};

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/first name/i), 'Jane');
  await user.type(screen.getByLabelText(/last name/i), 'Doe');
  await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
  await user.type(screen.getByLabelText(/^password/i), 'Password1');
};

describe('RegisterPage', () => {
  it('renders all form fields', () => {
    renderRegisterPage();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows an error when first name is too short', async () => {
    renderRegisterPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/first name/i), 'A');
    submitForm();

    await waitFor(
      () => expect(screen.getAllByText(/min 2 characters/i).length).toBeGreaterThan(0),
      { timeout: 3000 },
    );
  });

  it('shows an error for an invalid email', async () => {
    renderRegisterPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    submitForm();

    await waitFor(
      () => expect(screen.getByText(/invalid email/i)).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it('shows an error when password is too short', async () => {
    renderRegisterPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^password/i), 'short');
    submitForm();

    await waitFor(
      () => expect(screen.getByText(/min 8 characters/i)).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it('shows an error when password lacks an uppercase letter', async () => {
    renderRegisterPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^password/i), 'lowercase1');
    submitForm();

    await waitFor(
      () => expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it('shows an error when password lacks a number', async () => {
    renderRegisterPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^password/i), 'NoNumbersHere');
    submitForm();

    await waitFor(
      () => expect(screen.getByText(/must contain a number/i)).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it('calls the register API when form is valid', async () => {
    let apiCalled = false;
    server.use(
      http.post('http://localhost:8080/auth/register', () => {
        apiCalled = true;
        return HttpResponse.json({ success: true, message: 'Registered' });
      }),
    );

    renderRegisterPage();
    const user = userEvent.setup();

    await fillValidForm(user);
    submitForm();

    await waitFor(() => expect(apiCalled).toBe(true), { timeout: 3000 });
  });

  it('does not call the API when first name is missing', async () => {
    let apiCalled = false;
    server.use(
      http.post('http://localhost:8080/auth/register', () => {
        apiCalled = true;
        return HttpResponse.json({ success: true, message: 'Registered' });
      }),
    );

    renderRegisterPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'x@x.com');
    submitForm();

    await new Promise(r => setTimeout(r, 200));
    expect(apiCalled).toBe(false);
  });

  it('renders a link back to the login page', () => {
    renderRegisterPage();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });
});
