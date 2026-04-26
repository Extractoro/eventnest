/**
 * Runs before each test file's module loading (setupFiles).
 * Sets all required env vars from .env.test so env.ts passes Zod validation.
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.test') });

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (!TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Copy .env.test.example to .env.test and fill it in.',
  );
}

// Override DATABASE_URL / DIRECT_URL to point at the test DB
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.DIRECT_URL   = TEST_DATABASE_URL;

// Ensure all other required env vars are populated (use .env.test values or fallback)
process.env.JWT_SECRET          ??= 'test-secret-minimum-32-characters-long!!';
process.env.JWT_REFRESH_SECRET  ??= 'test-refresh-secret';
process.env.PORT                ??= '8081';
process.env.NODE_ENV              = 'test';
process.env.CLIENT_URL          ??= 'http://localhost:3000';
process.env.SMTP_HOST           ??= 'smtp.example.com';
process.env.SMTP_PORT           ??= '587';
process.env.SMTP_USER           ??= 'test@example.com';
process.env.SMTP_PASS           ??= 'testpassword';
process.env.SMTP_FROM           ??= 'EventNest Test <test@example.com>';
