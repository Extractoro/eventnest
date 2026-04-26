import request from 'supertest';
import app from '../app';
import { cleanAll, createUser, db } from './helpers/testDb';

const REGISTER_BODY = {
  firstName: 'Jane',
  lastName:  'Doe',
  email:     'jane.doe.auth@example.com',
  password:  'Password1',
};

beforeAll(async () => { await cleanAll(); });
afterAll(async ()  => { await cleanAll(); await db.$disconnect(); });

// ─── POST /auth/register ──────────────────────────────────────────────────────
describe('POST /auth/register', () => {
  it('registers a new user and returns 200', async () => {
    const res = await request(app).post('/auth/register').send(REGISTER_BODY);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 409 when email is already in use', async () => {
    const res = await request(app).post('/auth/register').send(REGISTER_BODY);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for validation errors (short password)', async () => {
    const res = await request(app).post('/auth/register').send({ ...REGISTER_BODY, password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'x@x.com' });
    expect(res.status).toBe(400);
  });
});

// ─── GET /auth/verify/:token ──────────────────────────────────────────────────
describe('GET /auth/verify/:token', () => {
  it('verifies a valid token and returns 200', async () => {
    const user = await db.user.findUnique({ where: { email: REGISTER_BODY.email } });
    expect(user?.verificationToken).toBeTruthy();
    const res = await request(app).get(`/auth/verify/${user!.verificationToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 for an invalid/expired token', async () => {
    const res = await request(app).get('/auth/verify/invalid-token-xyz');
    expect(res.status).toBe(400);
  });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
describe('POST /auth/login', () => {
  it('returns 401 for unverified user', async () => {
    await createUser({ email: 'unverified@example.com', verify: false });
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'unverified@example.com', password: 'Password1' });
    expect(res.status).toBe(401);
  });

  it('returns 200 and accessToken for verified credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: REGISTER_BODY.email, password: REGISTER_BODY.password });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: REGISTER_BODY.email, password: 'WrongPass9' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'not-an-email', password: 'x' });
    expect(res.status).toBe(400);
  });
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
describe('POST /auth/refresh', () => {
  it('returns a new accessToken when a valid refresh cookie is present', async () => {
    // Login first to get the refresh cookie
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: REGISTER_BODY.email, password: REGISTER_BODY.password });
    const cookie = loginRes.headers['set-cookie'] as unknown as string[];

    const res = await request(app).post('/auth/refresh').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('returns 401 when no refresh cookie is present', async () => {
    const res = await request(app).post('/auth/refresh');
    expect(res.status).toBe(401);
  });
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
describe('POST /auth/logout', () => {
  it('returns 401 without an access token', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(401);
  });

  it('returns 200 with a valid access token', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: REGISTER_BODY.email, password: REGISTER_BODY.password });
    const token = loginRes.body.data.accessToken;

    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

// ─── POST /auth/forgot-password ───────────────────────────────────────────────
describe('POST /auth/forgot-password', () => {
  it('always returns 200 (silent — does not leak whether email exists)', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: REGISTER_BODY.email });
    expect(res.status).toBe(200);
  });

  it('returns 200 even for unknown email', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'nobody@nowhere.com' });
    expect(res.status).toBe(200);
  });
});

// ─── POST /auth/reset-password/:token ────────────────────────────────────────
describe('POST /auth/reset-password/:token', () => {
  it('resets the password with a valid token', async () => {
    // Trigger forgot-password to populate the reset token
    await request(app)
      .post('/auth/forgot-password')
      .send({ email: REGISTER_BODY.email });

    const user = await db.user.findUnique({ where: { email: REGISTER_BODY.email } });
    expect(user?.resetPasswordToken).toBeTruthy();

    const res = await request(app)
      .post(`/auth/reset-password/${user!.resetPasswordToken}`)
      .send({ newPassword: 'NewPassword1' });
    expect(res.status).toBe(200);
  });

  it('returns 400 for an invalid/expired reset token', async () => {
    const res = await request(app)
      .post('/auth/reset-password/invalid-token')
      .send({ newPassword: 'NewPassword1' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when new password is too weak', async () => {
    const res = await request(app)
      .post('/auth/reset-password/any-token')
      .send({ newPassword: 'weak' });
    expect(res.status).toBe(400);
  });
});
