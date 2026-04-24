# EventNest — Architecture & Rewrite Specification

> Web Platform for Event Ticket Booking  
> Titarenko Vadym | ITIНФ-23-2 | NURE | 2025  
> Stack: Node.js + Express + Prisma + **PostgreSQL (Neon)** | React + TanStack Query + Zustand + React Hook Form  
> Deploy: **Render** (backend) + **Neon** (database) + **Netlify** (frontend)  
> Use case: local development + demo presentation

---

## PART 0 — MANUAL STEPS (do these yourself before starting Claude Code)

> Claude Code cannot create accounts, install system tools, or run interactive wizards.  
> Complete ALL steps in this section first, then hand the file to Claude Code.

---

### Step 1 — Install tools locally

```bash
node --version   # must be 18+
npm --version
git --version
```

If missing:
- **Node.js 18+** → https://nodejs.org (download LTS installer)
- **Git** → https://git-scm.com/downloads

---

### Step 2 — Create GitHub repository

1. Go to https://github.com/new
2. Name: `eventnest`
3. Visibility: **Public**
4. Do NOT check "Initialize with README"
5. Click **Create repository**
6. Copy the repo URL

---

### Step 3 — Create Neon account (PostgreSQL)

Neon is serverless PostgreSQL. Free tier: 0.5 GB, always online, no credit card.

1. Go to https://neon.tech → **Sign up with GitHub**
2. **New Project** → name: `eventnest` → region: EU Frankfurt
3. Dashboard → **Connection Details** → select **Prisma** from dropdown
4. Copy both `DATABASE_URL` and `DIRECT_URL` — you need both for Neon

---

### Step 4 — Create Render account

1. Go to https://render.com → **Sign up with GitHub**
2. Nothing to create yet — deployment happens via `render.yaml` after push

---

### Step 5 — Create Netlify account

1. Go to https://netlify.com → **Sign up with GitHub**
2. Nothing to create yet — deploy frontend after `npm run build`

---

### Step 6 — Initialize local project

```bash
mkdir eventnest && cd eventnest
git init
git remote add origin https://github.com/YOUR_USERNAME/eventnest.git
mkdir backend frontend
```

**Now give this file to Claude Code:**
> "Read EventNest_Spec.md. Start with Phase 1 of the Implementation Checklist. Ask before moving to Phase 2."

---

### Step 7 — After Claude Code finishes

**Test backend locally:**
```bash
cd backend
cp .env.example .env
# Fill DATABASE_URL and DIRECT_URL from Neon (Step 3)
# Fill JWT_SECRET with any random 32+ char string
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

**Test frontend locally:**
```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:8080
npm install
npm run dev
```

---

### Step 8 — Deploy backend to Render

1. Push to GitHub: `git add . && git commit -m "init" && git push -u origin main`
2. Render dashboard → **New** → **Web Service** → connect repo `eventnest`
3. Settings:
   - Root directory: `backend`
   - Build: `npm install && npm run build`
   - Start: `npm start`
4. Add env vars: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV=production`, `CLIENT_URL=https://YOUR-APP.netlify.app`, SMTP vars
5. Deploy. Copy URL: `https://eventnest-xxx.onrender.com`

---

### Step 9 — Deploy frontend to Netlify

```bash
cd frontend
# Create .env.production with VITE_API_URL=https://eventnest-xxx.onrender.com
npm run build
```
Netlify dashboard → **Add new site** → **Deploy manually** → drag `frontend/dist` folder.  
Copy Netlify URL → update `CLIENT_URL` in Render env vars → redeploy Render.

---

### Step 10 — Run migrations on production DB

```bash
cd backend
DATABASE_URL="your-neon-url" npx prisma migrate deploy
DATABASE_URL="your-neon-url" npx prisma db seed
```

Done. App is live.

---

## PART 1 — PROJECT OVERVIEW

EventNest is a full-stack web platform for booking tickets to events in various cities.

**Users:** browse events by category/date/city/keyword, book tickets, pay, cancel, manage profile.  
**Admins:** create/edit/delete events, view statistics and revenue.

### Why rewriting from scratch (original problems)

| Problem | Detail |
|---|---|
| No layering | Routes = controllers = services in one file |
| HTML in TypeScript | 300+ lines of email HTML inside auth.ts |
| Raw SQL | No ORM, no type safety, no repository layer |
| No validation | No Zod — inputs trusted as-is |
| Race condition | available_tickets is mutable counter, not computed |
| No price snapshot | Ticket price not stored at purchase time |
| Dead code | Commented-out versions still in repo |
| ts-ignore | Type errors suppressed instead of fixed |

---

## PART 2 — DATABASE SCHEMA

### Why PostgreSQL over MySQL

- Better support in Neon (serverless, free, always online)
- Prisma works identically — only one line in schema.prisma changes
- Better enum/JSON support, more standard SQL

### Changes from original schema

| Change | Reason |
|---|---|
| `available_tickets` REMOVED from Events | Computed from tickets, eliminates race condition |
| `price_at_purchase DECIMAL(10,2)` ADDED to Tickets | Immutable price snapshot at booking time |
| `quantity INT DEFAULT 1` ADDED to Tickets | One row = one booking action |
| `event_id` FK REMOVED from RecurringEvents | Breaks circular reference |

### Tables

#### Users
| Column | Type | Constraints |
|---|---|---|
| user_id | INT | PK, AUTO_INCREMENT |
| user_firstname | VARCHAR(50) | NOT NULL |
| user_lastname | VARCHAR(50) | NOT NULL |
| password | VARCHAR(255) | NOT NULL — bcrypt hash rounds=12 |
| email | VARCHAR(100) | NOT NULL, UNIQUE |
| phone | VARCHAR(15) | NULL |
| role | ENUM('user','admin') | DEFAULT 'user' |
| created_at | TIMESTAMP | DEFAULT NOW() |
| verificationToken | VARCHAR(255) | NULL — cleared after use |
| resetPasswordToken | VARCHAR(255) | NULL — cleared after use |
| verify | BOOLEAN | DEFAULT FALSE |

#### Events
| Column | Type | Constraints |
|---|---|---|
| event_id | INT | PK |
| event_name | VARCHAR(100) | NOT NULL |
| event_date | DATETIME | NOT NULL |
| description | TEXT | NULL |
| ticket_price | DECIMAL(10,2) | NOT NULL — current price for new bookings |
| capacity_event | INT | NOT NULL |
| isAvailable | BOOLEAN | DEFAULT TRUE |
| is_recurring | BOOLEAN | DEFAULT FALSE |
| venue_id | INT | FK → venues |
| category_id | INT | FK → categories |
| recurring_event_id | INT | FK → recurring_events, NULL |

**Computed (not stored):**
```
available_tickets = capacity_event - SUM(tickets.quantity WHERE status != 'cancelled')
```

#### Venues
| Column | Type | Constraints |
|---|---|---|
| venue_id | INT | PK |
| venue_name | VARCHAR(100) | UNIQUE |
| address | VARCHAR(255) | NOT NULL |
| city | VARCHAR(50) | NOT NULL |
| capacity | INT | NOT NULL |

#### Categories
| Column | Type | Constraints |
|---|---|---|
| category_id | INT | PK |
| category_name | VARCHAR(50) | UNIQUE |

Seed: `Concert, Theatre, Sport, Festival, Exhibition, Other`

#### Tickets
| Column | Type | Constraints |
|---|---|---|
| ticket_id | INT | PK |
| purchase_date | TIMESTAMP | DEFAULT NOW() |
| ticket_status | ENUM('booked','paid','cancelled') | DEFAULT 'booked' |
| event_id | INT | FK → events |
| user_id | INT | FK → users |
| price_at_purchase | DECIMAL(10,2) | NOT NULL — never modified after creation |
| quantity | INT | DEFAULT 1, >= 1 |

#### RecurringEvents
| Column | Type | Constraints |
|---|---|---|
| recurring_event_id | INT | PK |
| frequency | ENUM('daily','weekly','monthly','yearly') | NOT NULL |
| repeat_interval | INT | >= 1 |
| start_date | DATE | NOT NULL |
| end_date | DATE | NOT NULL |

### Business rules
- Emails must be unique
- Passwords stored as bcrypt rounds=12
- Email must be verified before login
- `capacity_event <= venue.capacity` (enforced in service)
- Booking only when `isAvailable=true` AND `available_tickets > 0`
- `price_at_purchase` set at booking time, never modified
- Ticket transitions: `booked→paid`, `booked→cancelled`, `paid→cancelled` NOT allowed
- Recurring: `start_date < end_date`, `end_date` in future, `repeat_interval >= 1`

---

## PART 3 — TARGET ARCHITECTURE

### Technology stack

| Layer | Technology |
|---|---|
| ORM | Prisma |
| Backend | Express.js + TypeScript |
| Validation | Zod |
| Auth | JWT access (15min, header) + refresh (7d, httpOnly cookie) |
| Email | Nodemailer + HTML templates in files |
| Password | bcrypt rounds=12 |
| Cron | node-cron |
| Frontend | React 18 + Vite + TypeScript |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| Forms | React Hook Form + Zod resolver |
| Routing | React Router v6 |
| Styling | SASS |
| HTTP client | Axios |
| Database | PostgreSQL via Neon |

### Backend folder structure

```
backend/
  src/
    config/
      database.ts          # Prisma client singleton
      env.ts               # Zod-validated env
      cors.ts
    modules/
      auth/
        auth.router.ts
        auth.controller.ts
        auth.service.ts
        auth.repository.ts
        auth.schema.ts
        auth.types.ts
      events/              # same pattern
      users/
      tickets/
      venues/
      categories/
      admin/
    emails/
      email.service.ts
      templates/
        verification.html
        password-reset.html
        welcome.html
    middleware/
      auth.middleware.ts
      admin.middleware.ts
      error.middleware.ts
      validate.middleware.ts
    utils/
      response.ts          # success() / apiError()
      errors.ts            # AppError, NotFoundError, ConflictError...
    app.ts
    server.ts
  prisma/
    schema.prisma
    seed.ts
  .env.example
  render.yaml
```

### Architectural layers

| Layer | File | Does | Cannot |
|---|---|---|---|
| Router | *.router.ts | Define routes, apply middleware | Business logic, DB |
| Controller | *.controller.ts | Parse req, call service, send res | Business logic, DB |
| Service | *.service.ts | All business logic | Access req/res |
| Repository | *.repository.ts | All Prisma queries only | Anything non-DB |
| Schema | *.schema.ts | Zod schemas | Nothing else |

### Frontend folder structure

```
frontend/src/
  api/
    client.ts              # Axios + interceptors
    auth.api.ts
    events.api.ts
    tickets.api.ts
    users.api.ts
    admin.api.ts
  hooks/
    useAuth.ts
    useEvents.ts
    useTickets.ts
    useUser.ts
  store/
    auth.store.ts          # userId, role, accessToken, isAuthenticated
    ui.store.ts            # theme
  components/
    ui/                    # Button, Input, Spinner, Modal, ErrorMessage
    events/                # EventCard, EventList, EventFilters
    tickets/               # TicketItem, TicketList
    forms/
  pages/                   # thin page components
  schemas/
    auth.schema.ts
    event.schema.ts
    ticket.schema.ts
  types/
  utils/
  router/
    index.tsx
    PrivateRoute.tsx
    AdminRoute.tsx
  .env.example
```

---

## PART 4 — PRISMA SCHEMA

File: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Role          { user admin }
enum TicketStatus  { booked paid cancelled }
enum Frequency     { daily weekly monthly yearly }

model User {
  user_id             Int       @id @default(autoincrement())
  user_firstname      String    @db.VarChar(50)
  user_lastname       String    @db.VarChar(50)
  password            String    @db.VarChar(255)
  email               String    @unique @db.VarChar(100)
  phone               String?   @db.VarChar(15)
  role                Role      @default(user)
  created_at          DateTime  @default(now())
  verificationToken   String?   @db.VarChar(255)
  resetPasswordToken  String?   @db.VarChar(255)
  verify              Boolean   @default(false)
  tickets             Ticket[]
}

model Venue {
  venue_id    Int     @id @default(autoincrement())
  venue_name  String  @unique @db.VarChar(100)
  address     String  @db.VarChar(255)
  city        String  @db.VarChar(50)
  capacity    Int
  events      Event[]
}

model Category {
  category_id    Int     @id @default(autoincrement())
  category_name  String  @unique @db.VarChar(50)
  events         Event[]
}

model RecurringEvent {
  recurring_event_id  Int       @id @default(autoincrement())
  frequency           Frequency
  repeat_interval     Int
  start_date          DateTime
  end_date            DateTime
  events              Event[]
}

model Event {
  event_id            Int       @id @default(autoincrement())
  event_name          String    @db.VarChar(100)
  event_date          DateTime
  description         String?   @db.Text
  ticket_price        Decimal   @db.Decimal(10, 2)
  capacity_event      Int
  isAvailable         Boolean   @default(true)
  is_recurring        Boolean   @default(false)
  venue_id            Int
  category_id         Int
  recurring_event_id  Int?
  venue               Venue           @relation(fields: [venue_id],           references: [venue_id])
  category            Category        @relation(fields: [category_id],        references: [category_id])
  recurringEvent      RecurringEvent? @relation(fields: [recurring_event_id], references: [recurring_event_id])
  tickets             Ticket[]
}

model Ticket {
  ticket_id         Int          @id @default(autoincrement())
  purchase_date     DateTime     @default(now())
  ticket_status     TicketStatus @default(booked)
  event_id          Int
  user_id           Int
  price_at_purchase Decimal      @db.Decimal(10, 2)
  quantity          Int          @default(1)
  event             Event        @relation(fields: [event_id], references: [event_id])
  user              User         @relation(fields: [user_id],  references: [user_id])
}
```

---

## PART 5 — API SPECIFICATION

### Standard response format
```
Success: { success: true,  message: string, data?: T }
Error:   { success: false, message: string, errors?: ZodIssue[] }
```

### Auth
| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | /auth/register | None | firstName, lastName, email, password, phone? | 200/400/409 |
| GET | /auth/verify/:token | None | — | 200/400 |
| POST | /auth/resend-verification | None | email | 200 |
| POST | /auth/login | None | email, password | 200: accessToken, role, userId |
| POST | /auth/refresh | Cookie | — | 200: accessToken |
| POST | /auth/logout | User | — | 200 |
| POST | /auth/forgot-password | None | email | 200 |
| POST | /auth/reset-password/:token | None | newPassword | 200 |

### Events
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | /events | User | ?category, city, date, search, page, limit — includes computed available_tickets |
| GET | /events/:id | User | Full event + venue + category + available_tickets |
| POST | /events | Admin | Full create with venue + optional recurring |
| PATCH | /events/:id | Admin | Partial update |
| DELETE | /events/:id | Admin | — |

### Tickets
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | /tickets/book | User | eventId, quantity — sets price_at_purchase from event |
| POST | /tickets/pay | User | ticketIds[] |
| POST | /tickets/cancel | User | ticketIds[] |
| GET | /tickets/my | User | — |

### Users
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | /users/me | User | — |
| PATCH | /users/me | User | firstName?, lastName?, phone? |
| POST | /users/change-password | User | currentPassword, newPassword |

### Admin
| Method | Path | Notes |
|---|---|---|
| GET | /admin/users | Paginated |
| PATCH | /admin/users/:id/role | — |
| GET | /admin/statistics | ticketsPerMonth[], popularCategories[], revenuePerMonth[] |
| GET/POST | /admin/venues | — |
| GET | /admin/categories | — |

---

## PART 6 — ZOD SCHEMAS

```ts
// auth.schema.ts
export const registerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName:  z.string().min(2).max(50),
  email:     z.string().email(),
  password:  z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  phone:     z.string().regex(/^\+?[0-9]{7,15}$/).optional(),
});
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

// event.schema.ts
export const createEventSchema = z.object({
  event_name:       z.string().min(3).max(100),
  event_date:       z.string().datetime(),
  description:      z.string().max(2000).optional(),
  ticket_price:     z.number().positive(),
  capacity_event:   z.number().int().positive(),
  isAvailable:      z.boolean().default(true),
  venue_name:       z.string().min(2),
  address:          z.string().min(5),
  city:             z.string().min(2),
  capacity:         z.number().int().positive(),
  category:         z.string().min(2),
  isRecurring:      z.boolean().default(false),
  start_date:       z.string().optional(),
  end_date:         z.string().optional(),
  frequency:        z.enum(['daily','weekly','monthly','yearly']).optional(),
  repeat_interval:  z.number().int().min(1).default(1),
}).refine(d => !d.isRecurring || (d.start_date && d.end_date && d.frequency), {
  message: 'Recurring events require start_date, end_date, frequency',
}).refine(d => d.capacity_event <= d.capacity, {
  message: 'capacity_event cannot exceed venue capacity',
});

// ticket.schema.ts
export const bookTicketSchema = z.object({
  eventId:  z.number().int().positive(),
  quantity: z.number().int().min(1).max(20),
});
export const ticketIdsSchema = z.object({
  ticketIds: z.array(z.number().int().positive()).min(1),
});
```

---

## PART 7 — IMPLEMENTATION PATTERNS

### Controller — thin
```ts
export const registerController = async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);
  await authService.register(body);
  res.status(200).json(success('Registration successful. Check your email.'));
};
```

### Service — business logic, no req/res
```ts
export const register = async (dto: RegisterDto): Promise<void> => {
  const existing = await userRepository.findByEmail(dto.email);
  if (existing) throw new ConflictError('Email already in use');
  const hashed = await bcrypt.hash(dto.password, 12);
  const token  = randomUUID();
  await userRepository.create({ ...dto, password: hashed, verificationToken: token });
  await emailService.sendVerification(dto.email, dto.firstName, token);
};
```

### Repository — Prisma only
```ts
export const findByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });
export const create = (data: Prisma.UserCreateInput) =>
  prisma.user.create({ data });
```

### Computed available_tickets (no N+1)
```ts
export const findAllEvents = async (filters: EventFilters) => {
  const events = await prisma.event.findMany({ /* filters */ });
  const ids = events.map(e => e.event_id);

  const bookedMap = await prisma.ticket.groupBy({
    by: ['event_id'],
    where: { event_id: { in: ids }, ticket_status: { not: 'cancelled' } },
    _sum: { quantity: true },
  });

  const byEvent = Object.fromEntries(bookedMap.map(b => [b.event_id, b._sum.quantity ?? 0]));

  return events.map(e => ({
    ...e,
    available_tickets: e.capacity_event - (byEvent[e.event_id] ?? 0),
  }));
};
```

### Validate middleware
```ts
export const validate = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success)
      return res.status(400).json(apiError('Validation failed', result.error.issues));
    req.body = result.data;
    next();
  };
```

### Global error handler
```ts
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) return res.status(err.statusCode).json(apiError(err.message));
  if (err instanceof ZodError)  return res.status(400).json(apiError('Validation failed', err.issues));
  console.error(err);
  res.status(500).json(apiError('Internal server error'));
});
```

### JWT tokens
```ts
const accessToken  = jwt.sign({ userId, role }, JWT_SECRET,         { expiresIn: '15m' });
const refreshToken = jwt.sign({ userId },       JWT_REFRESH_SECRET, { expiresIn: '7d' });
res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
res.json(success('Login successful', { accessToken, role, userId }));
```

### Email service
```ts
class EmailService {
  async sendVerification(to: string, name: string, token: string) {
    const html = this.render('verification', { name, link: `${CLIENT_URL}/auth/verify/${token}` });
    await this.transporter.sendMail({ to, subject: 'Confirm your email', html });
  }
  private render(name: string, vars: Record<string, string>) {
    const tpl = fs.readFileSync(`./emails/templates/${name}.html`, 'utf8');
    return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
  }
}
```

---

## PART 8 — FRONTEND PATTERNS

### Axios client
```ts
const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true });
apiClient.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
apiClient.interceptors.response.use(res => res, async err => {
  if (err.response?.status === 401) {
    const { data } = await axios.post('/auth/refresh', {}, { withCredentials: true });
    useAuthStore.getState().setAccessToken(data.data.accessToken);
    return apiClient(err.config);
  }
  return Promise.reject(err);
});
```

### Zustand auth store
```ts
export const useAuthStore = create<AuthState>()(
  persist(set => ({
    userId: null, role: null, accessToken: null, isAuthenticated: false,
    setAuth:        (userId, role, accessToken) => set({ userId, role, accessToken, isAuthenticated: true }),
    setAccessToken: (accessToken) => set({ accessToken }),
    clearAuth:      () => set({ userId: null, role: null, accessToken: null, isAuthenticated: false }),
  }), { name: 'auth', partialize: s => ({ userId: s.userId, role: s.role }) })
);
```

### TanStack Query
```ts
export const useEvents = (filters: EventFilters) =>
  useQuery({ queryKey: ['events', filters], queryFn: () => eventsApi.getAll(filters), staleTime: 5 * 60 * 1000 });

export const useBookTickets = () =>
  useMutation({ mutationFn: ticketsApi.book, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }) });
```

### React Hook Form + Zod
```ts
const form = useForm<LoginDto>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
const onSubmit = form.handleSubmit(async (data) => {
  const result = await loginMutation.mutateAsync(data);
  authStore.setAuth(result.userId, result.role, result.accessToken);
  navigate('/');
});
```

---

## PART 9 — ENVIRONMENT VARIABLES

### backend/.env.example
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/eventnest?sslmode=require
DIRECT_URL=postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/eventnest?sslmode=require
JWT_SECRET=replace-with-random-32+-char-string
JWT_REFRESH_SECRET=replace-with-another-random-string
PORT=8080
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=EventNest <your@gmail.com>
```

### frontend/.env.example
```env
VITE_API_URL=http://localhost:8080
```

### render.yaml (create at backend/render.yaml)
```yaml
services:
  - type: web
    name: eventnest-api
    env: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

---

## PART 10 — IMPLEMENTATION CHECKLIST

> Tell Claude Code: "Implement Phase 1. Ask before starting Phase 2."

### Phase 1 — Backend foundation
- [ ] cd backend && npm init -y
- [ ] Install deps: express cors cookie-parser morgan dotenv @prisma/client zod bcrypt jsonwebtoken nodemailer uuid node-cron
- [ ] Install dev deps: typescript ts-node nodemon @types/*
- [ ] tsconfig.json with strict:true, outDir:dist
- [ ] prisma/schema.prisma (full schema from Part 4)
- [ ] npx prisma generate
- [ ] src/config/database.ts — Prisma singleton
- [ ] src/config/env.ts — Zod-validated env
- [ ] src/utils/response.ts — success() / apiError()
- [ ] src/utils/errors.ts — AppError, NotFoundError, ConflictError, UnauthorizedError, ForbiddenError
- [ ] src/middleware/error.middleware.ts
- [ ] src/app.ts — Express setup
- [ ] src/server.ts — app.listen()
- [ ] backend/.env.example
- [ ] backend/render.yaml

### Phase 2 — Auth module
- [ ] auth.schema.ts
- [ ] auth.repository.ts
- [ ] emails/email.service.ts + templates/*.html
- [ ] auth.service.ts
- [ ] auth.controller.ts + auth.router.ts
- [ ] middleware/auth.middleware.ts
- [ ] middleware/admin.middleware.ts
- [ ] middleware/validate.middleware.ts

### Phase 3 — Core modules
- [ ] venues module
- [ ] categories module
- [ ] events module (getAll with groupBy for available_tickets, getById, create, update, delete)
- [ ] tickets module (book with price snapshot, pay, cancel, getUserTickets)
- [ ] users module (getMe, updateMe, changePassword)
- [ ] admin module (getUsers, updateRole, getStatistics with revenue)
- [ ] Register all routers in app.ts
- [ ] prisma/seed.ts — categories + demo events
- [ ] npx prisma migrate dev --name init && npx prisma db seed

### Phase 4 — Frontend foundation
- [ ] npm create vite@latest . -- --template react-ts
- [ ] Install all frontend deps
- [ ] src/api/client.ts
- [ ] src/store/auth.store.ts + ui.store.ts
- [ ] src/router/index.tsx + PrivateRoute + AdminRoute
- [ ] src/components/ui/ (Button, Input, Spinner, Modal, ErrorMessage)
- [ ] frontend/.env.example

### Phase 5 — Frontend features
- [ ] Signin + Signup (React Hook Form + Zod)
- [ ] SignupConfirm, ForgetPassword, ResetPassword
- [ ] Home — event list + filters + pagination
- [ ] EventDetail — info + BookTicketForm
- [ ] UserTickets — tickets with pay/cancel
- [ ] Profile — edit + change password
- [ ] Admin AddEvent — full form + recurring toggle
- [ ] Admin Statistics — charts

### Phase 6 — Polish
- [ ] Error boundaries on all routes
- [ ] Toast notifications for all mutations
- [ ] Loading + empty states
- [ ] Dark mode check
- [ ] eslint --fix
- [ ] CORS includes production Netlify URL

---

## PART 11 — ANTI-PATTERNS

- NEVER write raw SQL — Prisma only
- NEVER embed HTML in .ts files — use templates/*.html
- NEVER import prisma directly in controller or service — only via repository
- NEVER put business logic in a router file
- NEVER use req/res inside a service
- NEVER manually sync available_tickets — it is computed
- NEVER modify price_at_purchase after ticket creation
- NEVER leave commented-out dead code
- NEVER use // @ts-ignore — fix the type
- NEVER store tokens in localStorage — httpOnly cookie for refresh only
- NEVER build form state with useState — use React Hook Form
- NEVER put business logic in a React page component
- NEVER hardcode API URL in components — use VITE_API_URL

---

## PART 12 — QUICK REFERENCE

### Backend deps
express, @prisma/client, prisma, zod, bcrypt, jsonwebtoken, nodemailer, cookie-parser, cors, morgan, dotenv, uuid, node-cron

### Frontend deps
react, react-dom, react-router-dom@6, @tanstack/react-query@5, zustand, react-hook-form, zod, @hookform/resolvers, axios, react-toastify, chart.js, react-chartjs-2, luxon, sass

### Feature matrix
| Feature | User | Admin |
|---|---|---|
| Register + email verification | YES | YES |
| Login / Logout | YES | YES |
| Forgot & Reset password | YES | YES |
| Browse events (filters + pagination) | YES | YES |
| View event + available seats | YES | YES |
| Book tickets (quantity, price snapshot) | YES | NO |
| Pay / Cancel tickets | YES | NO |
| View ticket history | YES | NO |
| Edit profile + change password | YES | YES |
| Create / Edit / Delete events | NO | YES |
| Statistics + revenue | NO | YES |
| Manage user roles | NO | YES |

---

*EventNest Spec v3 — PostgreSQL + Neon + Render + Netlify | 2025*
