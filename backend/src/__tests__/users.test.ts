import request from 'supertest';
import app from '../app';
import { cleanAll, createUser, makeToken, bearerHeader, db } from './helpers/testDb';

const USER_PASSWORD = 'Password1';
let userToken: string;
let userId: number;

beforeAll(async () => {
  await cleanAll();
  const user = await createUser({ email: 'user@users.test', password: USER_PASSWORD });
  userId    = user.user_id;
  userToken = makeToken(user.user_id, 'user');
});

afterAll(async () => { await cleanAll(); await db.$disconnect(); });

// ─── GET /users/me ────────────────────────────────────────────────────────────
describe('GET /users/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/users/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user profile', async () => {
    const res = await request(app).get('/users/me').set(bearerHeader(userToken));
    expect(res.status).toBe(200);
    expect(res.body.data.user_id).toBe(userId);
    expect(res.body.data).not.toHaveProperty('password');
  });
});

// ─── PATCH /users/me ──────────────────────────────────────────────────────────
describe('PATCH /users/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).patch('/users/me').send({ firstName: 'New' });
    expect(res.status).toBe(401);
  });

  it('updates first and last name', async () => {
    const res = await request(app)
      .patch('/users/me')
      .set(bearerHeader(userToken))
      .send({ firstName: 'Updated', lastName: 'Name' });
    expect(res.status).toBe(200);
    expect(res.body.data.user_firstname).toBe('Updated');
    expect(res.body.data.user_lastname).toBe('Name');
  });

  it('updates phone number', async () => {
    const res = await request(app)
      .patch('/users/me')
      .set(bearerHeader(userToken))
      .send({ phone: '+380991234567' });
    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe('+380991234567');
  });

  it('returns 400 for invalid phone format', async () => {
    const res = await request(app)
      .patch('/users/me')
      .set(bearerHeader(userToken))
      .send({ phone: 'not-a-phone' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when firstName is too short', async () => {
    const res = await request(app)
      .patch('/users/me')
      .set(bearerHeader(userToken))
      .send({ firstName: 'A' });
    expect(res.status).toBe(400);
  });
});

// ─── POST /users/change-password ──────────────────────────────────────────────
describe('POST /users/change-password', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/users/change-password')
      .send({ currentPassword: USER_PASSWORD, newPassword: 'NewPass1' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for incorrect current password', async () => {
    const res = await request(app)
      .post('/users/change-password')
      .set(bearerHeader(userToken))
      .send({ currentPassword: 'WrongPass9', newPassword: 'NewPass1' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when new password is too weak', async () => {
    const res = await request(app)
      .post('/users/change-password')
      .set(bearerHeader(userToken))
      .send({ currentPassword: USER_PASSWORD, newPassword: 'weak' });
    expect(res.status).toBe(400);
  });

  it('changes password with correct current password', async () => {
    const res = await request(app)
      .post('/users/change-password')
      .set(bearerHeader(userToken))
      .send({ currentPassword: USER_PASSWORD, newPassword: 'NewPassword2' });
    expect(res.status).toBe(200);
  });
});
