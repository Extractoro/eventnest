import request from 'supertest';
import app from '../app';
import { cleanAll, createUser, createAdmin, seedCategories, makeToken, bearerHeader, db } from './helpers/testDb';

let userToken:  string;
let userId:     number;
let eventId:    number;
let ticketId:   number;
const TICKET_PRICE = 75;

beforeAll(async () => {
  await cleanAll();
  await seedCategories();

  const admin = await createAdmin({ email: 'admin@tickets.test' });
  const user  = await createUser({ email: 'user@tickets.test' });
  userId    = user.user_id;
  userToken = makeToken(user.user_id, 'user');
  const adminToken = makeToken(admin.user_id, 'admin');

  // Create an event to book tickets against
  const res = await request(app)
    .post('/events')
    .set(bearerHeader(adminToken))
    .send({
      event_name:     'Ticket Test Event',
      event_date:     '2027-08-20T19:00',
      ticket_price:   TICKET_PRICE,
      capacity_event: 50,
      isAvailable:    true,
      venue_name:     'Ticket Venue',
      address:        '10 Test Road',
      city:           'Lviv',
      capacity:       100,
      category:       'Concert',
      isRecurring:    false,
    });
  eventId = res.body.data.event_id;
});

afterAll(async () => { await cleanAll(); await db.$disconnect(); });

// ─── POST /tickets/book ───────────────────────────────────────────────────────
describe('POST /tickets/book', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).post('/tickets/book').send({ eventId, quantity: 1 });
    expect(res.status).toBe(401);
  });

  it('books a ticket and returns 201', async () => {
    const res = await request(app)
      .post('/tickets/book')
      .set(bearerHeader(userToken))
      .send({ eventId, quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.data.quantity).toBe(2);
    // price_at_purchase must snapshot the event price at booking time
    expect(Number(res.body.data.price_at_purchase)).toBe(TICKET_PRICE);
    ticketId = res.body.data.ticket_id;
  });

  it('returns 400 for validation error (quantity = 0)', async () => {
    const res = await request(app)
      .post('/tickets/book')
      .set(bearerHeader(userToken))
      .send({ eventId, quantity: 0 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when exceeding max quantity per booking (21)', async () => {
    const res = await request(app)
      .post('/tickets/book')
      .set(bearerHeader(userToken))
      .send({ eventId, quantity: 21 });
    expect(res.status).toBe(400);
  });

  it('returns 404 when event does not exist', async () => {
    const res = await request(app)
      .post('/tickets/book')
      .set(bearerHeader(userToken))
      .send({ eventId: 999999, quantity: 1 });
    expect(res.status).toBe(404);
  });

  it('returns 400 when not enough seats remain', async () => {
    // Try to book more than available (capacity_event = 50, booked = 2)
    const res = await request(app)
      .post('/tickets/book')
      .set(bearerHeader(userToken))
      .send({ eventId, quantity: 49 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/remaining/i);
  });
});

// ─── GET /tickets/my ──────────────────────────────────────────────────────────
describe('GET /tickets/my', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/tickets/my');
    expect(res.status).toBe(401);
  });

  it('returns the user\'s tickets', async () => {
    const res = await request(app).get('/tickets/my').set(bearerHeader(userToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

// ─── POST /tickets/pay ────────────────────────────────────────────────────────
describe('POST /tickets/pay', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).post('/tickets/pay').send({ ticketIds: [ticketId] });
    expect(res.status).toBe(401);
  });

  it('pays a booked ticket and returns 200', async () => {
    const res = await request(app)
      .post('/tickets/pay')
      .set(bearerHeader(userToken))
      .send({ ticketIds: [ticketId] });
    expect(res.status).toBe(200);
    expect(res.body.data.updated).toBe(1);
  });

  it('returns 400 when ticket is already paid (not in booked status)', async () => {
    const res = await request(app)
      .post('/tickets/pay')
      .set(bearerHeader(userToken))
      .send({ ticketIds: [ticketId] });
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty ticketIds array', async () => {
    const res = await request(app)
      .post('/tickets/pay')
      .set(bearerHeader(userToken))
      .send({ ticketIds: [] });
    expect(res.status).toBe(400);
  });
});

// ─── POST /tickets/cancel ─────────────────────────────────────────────────────
describe('POST /tickets/cancel', () => {
  let cancelableTicketId: number;

  beforeAll(async () => {
    // Book a fresh ticket (status: booked) to cancel
    const res = await request(app)
      .post('/tickets/book')
      .set(bearerHeader(userToken))
      .send({ eventId, quantity: 1 });
    cancelableTicketId = res.body.data.ticket_id;
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/tickets/cancel')
      .send({ ticketIds: [cancelableTicketId] });
    expect(res.status).toBe(401);
  });

  it('returns 400 when trying to cancel a paid ticket', async () => {
    // ticketId was paid in the pay tests above
    const res = await request(app)
      .post('/tickets/cancel')
      .set(bearerHeader(userToken))
      .send({ ticketIds: [ticketId] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/paid/i);
  });

  it('cancels a booked ticket and returns 200', async () => {
    const res = await request(app)
      .post('/tickets/cancel')
      .set(bearerHeader(userToken))
      .send({ ticketIds: [cancelableTicketId] });
    expect(res.status).toBe(200);
    expect(res.body.data.updated).toBe(1);
  });

  it('returns 404 for tickets that do not belong to the user', async () => {
    const otherUser = await createUser({ email: `other-${Date.now()}@example.com` });
    const otherToken = makeToken(otherUser.user_id, 'user');
    const res = await request(app)
      .post('/tickets/cancel')
      .set(bearerHeader(otherToken))
      .send({ ticketIds: [cancelableTicketId] }); // already cancelled but wrong owner check fires first
    expect(res.status).toBe(404);
  });
});
