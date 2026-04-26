/**
 * Runs once before all test suites (separate Node.js process).
 * Applies Prisma migrations to the test database.
 */
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

export default async function globalSetup() {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env.test') });

  const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
  if (!TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL must be set in .env.test before running tests.');
  }

  console.log('\n⚙  Running Prisma migrations on test database…');
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../../..'),
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
      DIRECT_URL:   TEST_DATABASE_URL,
    },
  });
  console.log('✓  Migrations applied\n');
}
