import request from 'supertest';
import app from '../app';
import { cleanAll, createUser, createAdmin, seedCategories, makeToken, bearerHeader, db } from './helpers/testDb';

let adminToken: string;
let userToken:  string;
let targetUserId: number;

beforeAll(async () => {
  await cleanAll();
  await seedCategories();

  const admin      = await createAdmin({ email: 'admin@admin.test' });
  const targetUser = await createUser({ email: 'target@admin.test' });

  adminToken   = makeToken(admin.user_id, 'admin');
  userToken    = makeToken(targetUser.user_id, 'user');
  targetUserId = targetUser.user_id;
});

afterAll(async () => { await cleanAll(); await db.$disconnect(); });

// ─── GET /admin/users ─────────────────────────────────────────────────────────
describe('GET /admin/users', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/admin/users');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a regular user', async () => {
    const res = await request(app).get('/admin/users').set(bearerHeader(userToken));
    expect(res.status).toBe(403);
  });

  it('returns paginated user list for admin', async () => {
    const res = await request(app).get('/admin/users').set(bearerHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('total');
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  it('respects page and limit query params', async () => {
    const res = await request(app)
      .get('/admin/users?page=1&limit=1')
      .set(bearerHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeLessThanOrEqual(1);
  });
});

// ─── PATCH /admin/users/:id/role ──────────────────────────────────────────────
describe('PATCH /admin/users/:id/role', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app)
      .patch(`/admin/users/${targetUserId}/role`)
      .send({ role: 'admin' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for a regular user', async () => {
    const res = await request(app)
      .patch(`/admin/users/${targetUserId}/role`)
      .set(bearerHeader(userToken))
      .send({ role: 'admin' });
    expect(res.status).toBe(403);
  });

  it('promotes a user to admin', async () => {
    const res = await request(app)
      .patch(`/admin/users/${targetUserId}/role`)
      .set(bearerHeader(adminToken))
      .send({ role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('admin');
  });

  it('demotes an admin back to user', async () => {
    const res = await request(app)
      .patch(`/admin/users/${targetUserId}/role`)
      .set(bearerHeader(adminToken))
      .send({ role: 'user' });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('user');
  });

  it('returns 400 for invalid role value', async () => {
    const res = await request(app)
      .patch(`/admin/users/${targetUserId}/role`)
      .set(bearerHeader(adminToken))
      .send({ role: 'superadmin' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent user', async () => {
    const res = await request(app)
      .patch('/admin/users/999999/role')
      .set(bearerHeader(adminToken))
      .send({ role: 'admin' });
    expect(res.status).toBe(404);
  });
});

// ─── GET /admin/statistics ────────────────────────────────────────────────────
describe('GET /admin/statistics', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/admin/statistics');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a regular user', async () => {
    const res = await request(app).get('/admin/statistics').set(bearerHeader(userToken));
    expect(res.status).toBe(403);
  });

  it('returns statistics with expected keys', async () => {
    const res = await request(app).get('/admin/statistics').set(bearerHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('ticketsPerMonth');
    expect(res.body.data).toHaveProperty('popularCategories');
    expect(res.body.data).toHaveProperty('revenuePerMonth');
  });
});

// ─── GET /admin/venues ────────────────────────────────────────────────────────
describe('GET /admin/venues', () => {
  it('returns 403 for a regular user', async () => {
    const res = await request(app).get('/admin/venues').set(bearerHeader(userToken));
    expect(res.status).toBe(403);
  });

  it('returns venues list for admin', async () => {
    const res = await request(app).get('/admin/venues').set(bearerHeader(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─── POST /admin/venues ───────────────────────────────────────────────────────
describe('POST /admin/venues', () => {
  const VENUE_BODY = { venue_name: 'New Test Venue', address: '99 Test Ave', city: 'Odesa', capacity: 300 };

  it('returns 403 for a regular user', async () => {
    const res = await request(app)
      .post('/admin/venues')
      .set(bearerHeader(userToken))
      .send(VENUE_BODY);
    expect(res.status).toBe(403);
  });

  it('creates a venue as admin', async () => {
    const res = await request(app)
      .post('/admin/venues')
      .set(bearerHeader(adminToken))
      .send(VENUE_BODY);
    expect(res.status).toBe(201);
    expect(res.body.data.venue_name).toBe(VENUE_BODY.venue_name);
  });

  it('returns 409 for a duplicate venue name', async () => {
    const res = await request(app)
      .post('/admin/venues')
      .set(bearerHeader(adminToken))
      .send(VENUE_BODY);
    expect(res.status).toBe(409);
  });

  it('returns 400 for validation error (missing city)', async () => {
    const { city: _, ...body } = VENUE_BODY;
    const res = await request(app)
      .post('/admin/venues')
      .set(bearerHeader(adminToken))
      .send(body);
    expect(res.status).toBe(400);
  });
});

// ─── GET /admin/categories ────────────────────────────────────────────────────
describe('GET /admin/categories', () => {
  it('returns categories list for admin', async () => {
    const res = await request(app).get('/admin/categories').set(bearerHeader(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
