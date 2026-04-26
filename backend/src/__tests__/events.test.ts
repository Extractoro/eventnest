import request from 'supertest';
import app from '../app';
import { cleanAll, createUser, createAdmin, seedCategories, makeToken, bearerHeader, db } from './helpers/testDb';

let adminToken: string;
let userToken:  string;
let createdEventId: number;

const EVENT_BODY = {
  event_name:     'Test Concert',
  event_date:     '2027-06-15T18:00',
  description:    'A test concert event',
  ticket_price:   100,
  capacity_event: 200,
  isAvailable:    true,
  venue_name:     'Test Arena',
  address:        '123 Main Street',
  city:           'Kyiv',
  capacity:       500,
  category:       'Concert',
  isRecurring:    false,
};

beforeAll(async () => {
  await cleanAll();
  await seedCategories();

  const admin = await createAdmin({ email: 'admin@events.test' });
  const user  = await createUser({ email: 'user@events.test' });

  adminToken = makeToken(admin.user_id, 'admin');
  userToken  = makeToken(user.user_id,  'user');
});

afterAll(async () => { await cleanAll(); await db.$disconnect(); });

// ─── GET /events ──────────────────────────────────────────────────────────────
describe('GET /events', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/events');
    expect(res.status).toBe(401);
  });

  it('returns paginated events list', async () => {
    const res = await request(app).get('/events').set(bearerHeader(userToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('total');
  });

  it('filters by category', async () => {
    const res = await request(app)
      .get('/events?category=Concert')
      .set(bearerHeader(userToken));
    expect(res.status).toBe(200);
  });

  it('filters by city', async () => {
    const res = await request(app)
      .get('/events?city=Kyiv')
      .set(bearerHeader(userToken));
    expect(res.status).toBe(200);
  });

  it('supports search query', async () => {
    const res = await request(app)
      .get('/events?search=Concert')
      .set(bearerHeader(userToken));
    expect(res.status).toBe(200);
  });
});

// ─── POST /events ─────────────────────────────────────────────────────────────
describe('POST /events', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).post('/events').send(EVENT_BODY);
    expect(res.status).toBe(401);
  });

  it('returns 403 for a regular user', async () => {
    const res = await request(app)
      .post('/events')
      .set(bearerHeader(userToken))
      .send(EVENT_BODY);
    expect(res.status).toBe(403);
  });

  it('creates an event as admin and returns 201', async () => {
    const res = await request(app)
      .post('/events')
      .set(bearerHeader(adminToken))
      .send(EVENT_BODY);
    expect(res.status).toBe(201);
    expect(res.body.data.event_name).toBe(EVENT_BODY.event_name);
    createdEventId = res.body.data.event_id;
  });

  it('returns 400 for validation errors (missing required field)', async () => {
    const { event_name: _, ...body } = EVENT_BODY;
    const res = await request(app)
      .post('/events')
      .set(bearerHeader(adminToken))
      .send(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 when capacity_event exceeds venue capacity', async () => {
    const res = await request(app)
      .post('/events')
      .set(bearerHeader(adminToken))
      .send({ ...EVENT_BODY, capacity_event: 9999, capacity: 10 });
    expect(res.status).toBe(400);
  });

  it('creates a recurring event with all required fields', async () => {
    const res = await request(app)
      .post('/events')
      .set(bearerHeader(adminToken))
      .send({
        ...EVENT_BODY,
        event_name:      'Recurring Show',
        isRecurring:     true,
        start_date:      '2027-06-15',
        end_date:        '2027-12-15',
        frequency:       'weekly',
        repeat_interval: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.is_recurring).toBe(true);
  });
});

// ─── GET /events/:id ──────────────────────────────────────────────────────────
describe('GET /events/:id', () => {
  it('returns the event with available_tickets field', async () => {
    const res = await request(app)
      .get(`/events/${createdEventId}`)
      .set(bearerHeader(userToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('available_tickets');
    expect(res.body.data.event_id).toBe(createdEventId);
  });

  it('returns 404 for a non-existent event', async () => {
    const res = await request(app).get('/events/999999').set(bearerHeader(userToken));
    expect(res.status).toBe(404);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get(`/events/${createdEventId}`);
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /events/:id ────────────────────────────────────────────────────────
describe('PATCH /events/:id', () => {
  it('updates an event as admin', async () => {
    const res = await request(app)
      .patch(`/events/${createdEventId}`)
      .set(bearerHeader(adminToken))
      .send({ event_name: 'Updated Concert', ticket_price: 150 });
    expect(res.status).toBe(200);
    expect(res.body.data.event_name).toBe('Updated Concert');
  });

  it('returns 403 for a regular user', async () => {
    const res = await request(app)
      .patch(`/events/${createdEventId}`)
      .set(bearerHeader(userToken))
      .send({ event_name: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('returns 404 when event does not exist', async () => {
    const res = await request(app)
      .patch('/events/999999')
      .set(bearerHeader(adminToken))
      .send({ event_name: 'Ghost' });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /events/:id ───────────────────────────────────────────────────────
describe('DELETE /events/:id', () => {
  it('returns 403 for a regular user', async () => {
    const res = await request(app)
      .delete(`/events/${createdEventId}`)
      .set(bearerHeader(userToken));
    expect(res.status).toBe(403);
  });

  it('deletes an event as admin and returns 200', async () => {
    const res = await request(app)
      .delete(`/events/${createdEventId}`)
      .set(bearerHeader(adminToken));
    expect(res.status).toBe(200);
  });

  it('returns 404 after deletion', async () => {
    const res = await request(app)
      .get(`/events/${createdEventId}`)
      .set(bearerHeader(userToken));
    expect(res.status).toBe(404);
  });
});
