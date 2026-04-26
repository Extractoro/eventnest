/**
 * Shared test-database helpers.
 * Provides DB seeding, cleanup utilities, and JWT token generation.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Use a dedicated Prisma instance; DATABASE_URL is set to TEST_DATABASE_URL by env.setup.ts
export const db = new PrismaClient();

// ─── Cleanup ─────────────────────────────────────────────────────────────────

/** Deletes all rows in FK-safe order. Call in beforeAll to start each suite clean. */
export const cleanAll = async () => {
  await db.ticket.deleteMany();
  await db.event.deleteMany();
  await db.recurringEvent.deleteMany();
  await db.venue.deleteMany();
  await db.category.deleteMany();
  await db.user.deleteMany();
};

// ─── Seed helpers ────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 1; // low rounds for test speed

export const createUser = async (overrides: {
  email?: string;
  password?: string;
  role?: 'user' | 'admin';
  verify?: boolean;
  firstName?: string;
  lastName?: string;
} = {}) => {
  const plain = overrides.password ?? 'Password1';
  const hashed = await bcrypt.hash(plain, BCRYPT_ROUNDS);
  return db.user.create({
    data: {
      user_firstname: overrides.firstName ?? 'Test',
      user_lastname:  overrides.lastName  ?? 'User',
      email:          overrides.email     ?? `test-${Date.now()}-${Math.random()}@example.com`,
      password:       hashed,
      role:           overrides.role      ?? 'user',
      verify:         overrides.verify    ?? true,
    },
  });
};

export const createAdmin = (overrides: { email?: string; password?: string } = {}) =>
  createUser({ ...overrides, role: 'admin', verify: true });

export const seedCategories = async (names = ['Festival', 'Concert', 'Sport']) => {
  for (const category_name of names) {
    await db.category.upsert({
      where:  { category_name },
      update: {},
      create: { category_name },
    });
  }
};

// ─── Token helpers ───────────────────────────────────────────────────────────

/** Generates a signed JWT directly, bypassing the login endpoint. */
export const makeToken = (userId: number, role: 'user' | 'admin' = 'user') =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '1h' });

export const bearerHeader = (token: string) => ({ Authorization: `Bearer ${token}` });
