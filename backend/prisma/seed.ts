import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Categories
  const categoryNames = ['Concert', 'Theatre', 'Sport', 'Festival', 'Exhibition', 'Other'];
  const categories = await Promise.all(
    categoryNames.map(name =>
      prisma.category.upsert({
        where: { category_name: name },
        update: {},
        create: { category_name: name },
      }),
    ),
  );
  console.log(`Seeded ${categories.length} categories`);

  // Demo venue
  const venue = await prisma.venue.upsert({
    where: { venue_name: 'Kharkiv Palace' },
    update: {},
    create: {
      venue_name: 'Kharkiv Palace',
      address: 'Svobody Square 4',
      city: 'Kharkiv',
      capacity: 2000,
    },
  });

  // Demo events
  const concert   = categories.find(c => c.category_name === 'Concert')!;
  const festival  = categories.find(c => c.category_name === 'Festival')!;
  const sport     = categories.find(c => c.category_name === 'Sport')!;

  await prisma.event.upsert({
    where: { event_id: 1 },
    update: {},
    create: {
      event_name:     'Summer Rock Night',
      event_date:     new Date('2025-07-15T20:00:00Z'),
      description:    'An unforgettable rock concert featuring top Ukrainian bands.',
      ticket_price:   450,
      capacity_event: 800,
      isAvailable:    true,
      is_recurring:   false,
      venue_id:       venue.venue_id,
      category_id:    concert.category_id,
    },
  });

  await prisma.event.upsert({
    where: { event_id: 2 },
    update: {},
    create: {
      event_name:     'Kharkiv Jazz Festival',
      event_date:     new Date('2025-08-20T18:00:00Z'),
      description:    'Three days of smooth jazz from local and international artists.',
      ticket_price:   350,
      capacity_event: 500,
      isAvailable:    true,
      is_recurring:   false,
      venue_id:       venue.venue_id,
      category_id:    festival.category_id,
    },
  });

  await prisma.event.upsert({
    where: { event_id: 3 },
    update: {},
    create: {
      event_name:     'City Marathon 2025',
      event_date:     new Date('2025-09-10T08:00:00Z'),
      description:    'Annual city marathon — 5 km, 10 km, and 42 km routes.',
      ticket_price:   150,
      capacity_event: 1500,
      isAvailable:    true,
      is_recurring:   false,
      venue_id:       venue.venue_id,
      category_id:    sport.category_id,
    },
  });

  // Admin user
  const adminPassword = await bcrypt.hash('Admin1234', 12);
  await prisma.user.upsert({
    where: { email: 'admin@eventnest.dev' },
    update: {},
    create: {
      user_firstname: 'Admin',
      user_lastname:  'EventNest',
      email:          'admin@eventnest.dev',
      password:       adminPassword,
      role:           'admin',
      verify:         true,
    },
  });

  console.log('Seed complete.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
