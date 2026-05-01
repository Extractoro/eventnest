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
  BREVO_API_KEY:       z.string(),
  BREVO_SENDER_EMAIL:  z.string().email(),
});

type Env = z.infer<typeof envSchema>;

const parseEnv = (): Env => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
};

export const env: Env = parseEnv();
