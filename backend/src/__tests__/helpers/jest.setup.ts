/**
 * Runs after Jest is initialised but before each test file.
 * Mocks nodemailer so no real SMTP connections are made during tests.
 */
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-mock-id' }),
  }),
}));
