import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL:        z.string().url(),
  DIRECT_URL:          z.string().url(),
  JWT_SECRET:          z.string().min(32),
  JWT_REFRESH_SECRET:  z.string().min(1),
  PORT:                z.coerce.number().default(8080),
  NODE_ENV:            z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL:          z.string().url(),
  SMTP_HOST:           z.string(),
  SMTP_PORT:           z.coerce.number().default(587),
  SMTP_USER:           z.string(),
  SMTP_PASS:           z.string(),
  SMTP_FROM:           z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
