import { env } from '../config/env';

// Templates are inlined to avoid fs.readFileSync at runtime
// (tsc does not copy .html files to dist/).
const TEMPLATES = {
  verification: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your email — EventNest</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; padding: 40px; }
    h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 8px; }
    p { color: #555; line-height: 1.6; }
    .btn { display: inline-block; margin-top: 24px; padding: 14px 32px; background: #e94560; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; }
    .footer { margin-top: 32px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hi {{name}},</h1>
    <p>Thanks for signing up to <strong>EventNest</strong>! Please confirm your email address to activate your account.</p>
    <a href="{{link}}" class="btn" style="color: #fff">Confirm Email</a>
    <p>Or copy this link into your browser:<br /><a href="{{link}}">{{link}}</a></p>
    <div class="footer">
      <p>If you didn't create an account, you can safely ignore this email.</p>
      <p>&copy; 2025 EventNest</p>
    </div>
  </div>
</body>
</html>`,

  'password-reset': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password — EventNest</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; padding: 40px; }
    h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 8px; }
    p { color: #555; line-height: 1.6; }
    .btn { display: inline-block; margin-top: 24px; padding: 14px 32px; background: #e94560; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; }
    .footer { margin-top: 32px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hi {{name}},</h1>
    <p>We received a request to reset your <strong>EventNest</strong> password. Click the button below to choose a new password.</p>
    <a href="{{link}}" class="btn">Reset Password</a>
    <p>Or copy this link into your browser:<br /><a href="{{link}}">{{link}}</a></p>
    <div class="footer">
      <p>This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
      <p>&copy; 2025 EventNest</p>
    </div>
  </div>
</body>
</html>`,

  welcome: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to EventNest</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; padding: 40px; }
    h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 8px; }
    p { color: #555; line-height: 1.6; }
    .btn { display: inline-block; margin-top: 24px; padding: 14px 32px; background: #e94560; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; }
    .footer { margin-top: 32px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to EventNest, {{name}}!</h1>
    <p>Your email has been confirmed and your account is now active. Start exploring events near you.</p>
    <a href="{{link}}" class="btn">Browse Events</a>
    <div class="footer">
      <p>&copy; 2025 EventNest</p>
    </div>
  </div>
</body>
</html>`,
} as const;

type TemplateName = keyof typeof TEMPLATES;

const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';

const renderTemplate = (name: TemplateName, vars: Record<string, string>): string =>
  TEMPLATES[name].replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');

/**
 * Sends a transactional email via Brevo's HTTP API (port 443).
 * Using HTTP avoids SMTP port blocking on cloud platforms like Render.
 */
const send = async (to: string, subject: string, html: string): Promise<void> => {
  const response = await fetch(BREVO_SEND_URL, {
    method: 'POST',
    headers: {
      'accept':       'application/json',
      'content-type': 'application/json',
      'api-key':      env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender:      { name: 'EventNest', email: env.BREVO_SENDER_EMAIL },
      to:          [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo API ${response.status}: ${body}`);
  }
};

export const sendVerification = (to: string, name: string, token: string) =>
  send(
    to,
    'Confirm your email — EventNest',
    renderTemplate('verification', { name, link: `${env.CLIENT_URL}/auth/verify/${token}` }),
  );

export const sendPasswordReset = (to: string, name: string, token: string) =>
  send(
    to,
    'Reset your password — EventNest',
    renderTemplate('password-reset', { name, link: `${env.CLIENT_URL}/auth/reset-password/${token}` }),
  );

export const sendWelcome = (to: string, name: string) =>
  send(
    to,
    'Welcome to EventNest!',
    renderTemplate('welcome', { name, link: env.CLIENT_URL }),
  );
