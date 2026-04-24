import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

const render = (name: string, vars: Record<string, string>): string => {
  const tpl = fs.readFileSync(
    path.join(__dirname, 'templates', `${name}.html`),
    'utf8',
  );
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
};

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
