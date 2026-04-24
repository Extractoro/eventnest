import nodemailer from 'nodemailer';
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
    <a href="{{link}}" class="btn">Confirm Email</a>
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

const transporter = nodemailer.createTransport({
  host:   env.SMTP_HOST,
  port:   env.SMTP_PORT,
  secure: false,
  auth:   { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

const render = (name: TemplateName, vars: Record<string, string>): string =>
  TEMPLATES[name].replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');

const send = (to: string, subject: string, html: string) =>
  transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });

export const sendVerification = (to: string, name: string, token: string) =>
  send(
    to,
    'Confirm your email — EventNest',
    render('verification', { name, link: `${env.CLIENT_URL}/auth/verify/${token}` }),
  );

export const sendPasswordReset = (to: string, name: string, token: string) =>
  send(
    to,
    'Reset your password — EventNest',
    render('password-reset', { name, link: `${env.CLIENT_URL}/auth/reset-password/${token}` }),
  );

export const sendWelcome = (to: string, name: string) =>
  send(
    to,
    'Welcome to EventNest!',
    render('welcome', { name, link: env.CLIENT_URL }),
  );
