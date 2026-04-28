# EventNest — Project Technical Description

> University course project · Theory of Programming · NURE · Group ITIНФ-23-2 · 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Database Schema](#4-database-schema)
5. [Backend Module Breakdown](#5-backend-module-breakdown)
6. [Frontend Structure](#6-frontend-structure)
7. [State Management & Data Fetching](#7-state-management--data-fetching)
8. [Authentication & Security](#8-authentication--security)
9. [Design Patterns Applied](#9-design-patterns-applied)
10. [SOLID Principles in Practice](#10-solid-principles-in-practice)
11. [Refactoring & Clean Code](#11-refactoring--clean-code)
12. [Deployment & Configuration](#12-deployment--configuration)

---

## 1. Project Overview

**EventNest** is a full-stack ticket-booking platform for concerts, conferences, and other public events. Users browse events, book tickets, pay for bookings, and cancel reservations. Administrators manage the full catalogue — creating, editing, and removing events, venues, and categories — while a dedicated Admin Panel provides real-time statistics, user role management, and ticket-level status overrides.

### Key Capabilities

| Area | Feature |
|------|---------|
| Public | Browse events with filters (category, city, date, search text) |
| Auth | Register, verify email, login, JWT refresh, forgot/reset password |
| Tickets | Book (quantity-limited), pay, cancel; per-user cap at 10 % of event capacity |
| Admin — Events | Create, edit, delete events; recurring-event management |
| Admin — Venues | CRUD for venue records |
| Admin — Users | List all users, promote/demote between `user` and `admin` roles |
| Admin — Tickets | View all tickets across all users; override status (book ↔ paid ↔ cancel) |
| Admin — Stats | Monthly ticket counts, revenue per month, popular categories (bar/pie charts) |
| UX | Dark/light theme toggle; responsive layout; toast notifications |

---

## 2. Technology Stack

### Backend

| Concern | Choice | Version |
|---------|--------|---------|
| Runtime | Node.js | 20 LTS |
| Framework | Express | ^5.2.1 |
| ORM | Prisma | ^5.22.0 |
| Database | PostgreSQL (Neon serverless) | 16 |
| Validation | Zod | ^4.3.6 |
| Auth tokens | jsonwebtoken | ^9.0.2 |
| Password hashing | bcrypt | ^5.1.1 |
| Email | nodemailer | ^6.9.16 |
| Language | TypeScript (strict) | ^5 |
| Testing | Jest + ts-jest + Supertest | — |

### Frontend

| Concern | Choice | Version |
|---------|--------|---------|
| UI library | React | ^19.2.5 |
| Build tool | Vite | ^6.3.5 |
| Routing | React Router DOM | ^6.30.3 |
| Server state | TanStack Query | ^5.100.1 |
| Client state | Zustand (+ persist) | ^5.0.12 |
| Forms | React Hook Form | ^7.73.1 |
| Validation | Zod + @hookform/resolvers | ^4.3.6 |
| HTTP | Axios | ^1.9.0 |
| Charts | Chart.js + react-chartjs-2 | ^4.4.9 |
| Dates | Luxon | ^3.6.1 |
| Notifications | react-toastify | ^11.0.5 |
| Styling | CSS Modules + SCSS | — |
| Testing | Vitest + Testing Library + MSW | — |

---

## 3. Architecture Overview

The project follows a strict **Layered Architecture** on both backend and frontend with explicit dependency rules.

### Backend Layer Diagram

```
HTTP Request
     │
     ▼
┌─────────────┐
│  router.ts  │  Route declaration + middleware attachment only
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  controller.ts   │  Parse HTTP input → call service → format HTTP response
└──────┬───────────┘
       │
       ▼
┌──────────────┐
│  service.ts  │  Business logic, validation of domain rules, error throwing
└──────┬───────┘
       │
       ▼
┌────────────────┐
│ repository.ts  │  Prisma queries only — no business logic
└──────┬─────────┘
       │
       ▼
┌────────────────────┐
│  PostgreSQL/Prisma │
└────────────────────┘
```

**Dependency rules never violated:**
- A router never calls a service or repository directly.
- A controller never calls a repository.
- A service never imports `Request` or `Response` from Express.
- A repository never contains business logic.
- Cross-module service imports are forbidden (e.g. `auth.service` cannot import from `events.service`).

### Frontend Layer Diagram

```
Page Component
     │  uses
     ▼
Custom Hook (useEvents, useTickets, useAdmin…)
     │  calls
     ▼
API Function (api/events.api.ts)
     │  calls
     ▼
Axios apiClient (api/client.ts)
     │
     ▼
Backend REST API
```

### Project Directory Structure

```
eventnest/
├── backend/
│   ├── src/
│   │   ├── config/          # database.ts, env.ts, cors.ts
│   │   ├── emails/          # email.service.ts + HTML templates
│   │   ├── middleware/       # auth, admin, validate, error
│   │   ├── modules/
│   │   │   ├── auth/        # router, controller, service, repository, schema, types
│   │   │   ├── events/      # router, controller, service, repository, schema, types
│   │   │   ├── tickets/     # router, controller, service, repository, schema
│   │   │   ├── users/       # router, controller, service, repository, schema
│   │   │   ├── admin/       # router, controller, service, repository, schema
│   │   │   ├── venues/      # repository, service
│   │   │   └── categories/  # repository, service
│   │   ├── utils/           # errors.ts, response.ts
│   │   ├── app.ts
│   │   └── server.ts
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
└── frontend/
    └── src/
        ├── api/             # client.ts + per-module API files
        ├── components/
        │   ├── forms/       # AuthCard.tsx, EventForm.tsx
        │   ├── events/      # EventCard.tsx, EventFilters.tsx
        │   ├── layout/      # Layout.tsx, Navbar.tsx
        │   └── ui/          # Button, Input, Modal, Spinner, ErrorMessage, ErrorBoundary
        ├── hooks/           # useAuth, useEvents, useTickets, useUser, useAdmin, useTheme
        ├── pages/           # All page components
        ├── router/          # index.tsx, PrivateRoute.tsx, AdminRoute.tsx
        ├── schemas/         # Zod schemas for forms
        ├── store/           # auth.store.ts, ui.store.ts
        ├── styles/          # global.scss with CSS variables
        ├── test/            # MSW handlers, setup, renderWithProviders
        ├── types/           # index.ts (all shared TypeScript interfaces)
        └── utils/           # errorMessage.ts, format.ts
```

---

## 4. Database Schema

### Prisma Models

#### User
```
user_id          Int       @id @default(autoincrement())
user_firstname   String
user_lastname    String
email            String    @unique
password         String
phone            String?
role             Role      @default(user)
verify           Boolean   @default(false)
verificationToken    String?
resetPasswordToken   String?
created_at       DateTime  @default(now())
tickets          Ticket[]
```

#### Venue
```
venue_id    Int     @id @default(autoincrement())
venue_name  String  @unique
address     String
city        String
capacity    Int
events      Event[]
```

#### Category
```
category_id    Int     @id @default(autoincrement())
category_name  String  @unique
events         Event[]
```

#### Event
```
event_id        Int       @id @default(autoincrement())
event_name      String
event_date      DateTime
description     String?
ticket_price    Decimal   @db.Decimal(10,2)
capacity_event  Int
isAvailable     Boolean   @default(true)
is_recurring    Boolean   @default(false)
venue_id        Int       @relation(Venue)
category_id     Int       @relation(Category)
recurringEvent  RecurringEvent?
tickets         Ticket[]
```

`available_tickets` is **never stored**. It is computed at query time:
```
available = capacity_event − SUM(tickets.quantity WHERE status ≠ 'cancelled')
```
For list queries, a single `prisma.ticket.groupBy` aggregation avoids N+1 queries.

#### RecurringEvent
```
recurring_event_id  Int        @id @default(autoincrement())
event_id            Int        @unique @relation(Event)
frequency           Frequency
repeat_interval     Int        @default(1)
start_date          DateTime
end_date            DateTime
```

#### Ticket
```
ticket_id          Int          @id @default(autoincrement())
event_id           Int          @relation(Event)
user_id            Int          @relation(User)
quantity           Int          @default(1)
price_at_purchase  Decimal      @db.Decimal(10,2)
ticket_status      TicketStatus @default(booked)
purchase_date      DateTime     @default(now())
```

`price_at_purchase` is a **snapshot** of `event.ticket_price` at booking time — it never changes after creation.

### Enums

| Enum | Values |
|------|--------|
| `Role` | `user`, `admin` |
| `TicketStatus` | `booked`, `paid`, `cancelled` |
| `Frequency` | `daily`, `weekly`, `monthly`, `yearly` |

---

## 5. Backend Module Breakdown

### `auth` module

**Routes** (`POST /api/auth/…`, `GET /api/auth/…`)

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| POST | `/register` | validate(registerSchema) | Create account; send verification email |
| GET | `/verify/:token` | — | Mark email verified, send welcome email |
| POST | `/resend-verification` | validate(resendVerificationSchema) | Re-send verification link |
| POST | `/login` | validate(loginSchema) | Return access token + set refresh cookie |
| POST | `/refresh` | — | Rotate access token from httpOnly cookie |
| POST | `/logout` | authMiddleware | Clear refresh cookie |
| POST | `/forgot-password` | validate(forgotPasswordSchema) | Send reset link (silent if unknown) |
| POST | `/reset-password/:token` | validate(resetPasswordSchema) | Hash new password |

**Zod schemas** — `registerSchema` (firstName, lastName, email, password with regex rules, optional phone), `loginSchema`, `resendVerificationSchema`, `forgotPasswordSchema`, `resetPasswordSchema`.

**Service key logic:**
- `register()` — checks for existing email (`ConflictError`), hashes password with `bcrypt` (12 rounds), generates `randomUUID()` token, creates user, fires email non-fatally (failure is logged but not propagated).
- `login()` — validates email+password, checks `verify` flag, signs 15-min access token (HS256, `JWT_SECRET`) and 7-day refresh token (`JWT_REFRESH_SECRET`).
- `refresh()` — verifies refresh JWT, loads user, re-issues access token.

**Repository functions:** `findByEmail`, `findById`, `findByVerificationToken`, `findByResetToken`, `create`, `update`.

---

### `events` module

**Routes** (`/api/events`)

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| GET | `/` | auth | Paginated list with filters |
| GET | `/:id` | auth | Single event with available tickets |
| POST | `/` | auth, admin, validate | Create event + venue + optional recurring |
| PATCH | `/:id` | auth, admin, validate | Update event fields |
| DELETE | `/:id` | auth, admin | Delete event |

**Query filters:** `category`, `city`, `date` (exact day), `search` (event name), `page`, `limit` (default 20, max 100).

**Service key logic:**
- `create()` — calls `venueService.getOrCreate()` (upsert by name) and `categoryService.getByName()`, then builds a `Prisma.EventCreateInput` with optional `recurringEvent.create`.
- `update()` — partial update with three-branch recurring state machine: _turning on_ (create recurringEvent), _turning off_ (disconnect), _updating existing_ (partial update).
- `remove()` — existence check before `eventRepo.remove`.

**available_tickets computation:**
- List endpoint: `prisma.ticket.groupBy({ by: ['event_id'], _sum: { quantity: true }, where: { status: { not: 'cancelled' } } })` in a single query for all returned event IDs.
- Single endpoint: `prisma.ticket.aggregate({ _sum: { quantity: true }, where: { event_id, status: { not: 'cancelled' } } })`.

---

### `tickets` module

**Routes** (`/api/tickets` — all require `authMiddleware`)

| Method | Path | Body schema | Description |
|--------|------|------------|-------------|
| POST | `/book` | bookTicketSchema | Book tickets for an event |
| POST | `/pay` | ticketIdsSchema | Mark booked tickets as paid |
| POST | `/cancel` | ticketIdsSchema | Cancel booked tickets (paid cannot be cancelled by user) |
| GET | `/my` | — | All tickets for the authenticated user |

**Service key logic:**
- `book()` — checks event availability, remaining capacity, and per-user cap: `maxPerUser = Math.ceil(capacity_event × 0.1)`. Snapshots `price_at_purchase = event.ticket_price`.
- `pay()` — verifies tickets belong to user; rejects any ticket not in `booked` status.
- `cancel()` — verifies ownership; rejects `paid` tickets (only `booked` may be cancelled by users).

**Schemas:** `bookTicketSchema` (eventId int+, quantity 1–20), `ticketIdsSchema` (ticketIds array of int+, min 1).

---

### `users` module

**Routes** (`/api/users` — all require `authMiddleware`)

| Method | Path | Body schema | Description |
|--------|------|------------|-------------|
| GET | `/me` | — | Return profile (no password) |
| PATCH | `/me` | updateMeSchema | Update first/last name or phone |
| POST | `/change-password` | changePasswordSchema | Verify current password, hash new one |

**Repository:** `findById` (explicit `select` excluding password), `findByIdWithPassword` (full row for bcrypt compare), `update`.

---

### `admin` module

**Routes** (`/api/admin` — require `authMiddleware` + `adminMiddleware`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | Paginated user list |
| PATCH | `/users/:id/role` | Promote/demote user |
| GET | `/statistics` | Aggregated stats (raw SQL) |
| GET | `/events` | Paginated event list (all, incl. unavailable) |
| PATCH | `/events/:id` | Quick-edit event fields |
| DELETE | `/events/:id` | Delete (rejects if active tickets exist) |
| GET | `/venues` | All venues |
| POST | `/venues` | Create venue |
| PATCH | `/venues/:id` | Update venue |
| DELETE | `/venues/:id` | Delete venue |
| GET | `/tickets` | Paginated tickets (filter by status/search) |
| PATCH | `/tickets/:id/status` | Override ticket status (admin bypass) |
| GET | `/categories` | All categories |

**Statistics** use three `prisma.$queryRaw` calls:
- `ticketsPerMonth` — `GROUP BY TO_CHAR(purchase_date, 'YYYY-MM')`, last 12 months.
- `popularCategories` — JOIN Event → Category, `GROUP BY category_name`, top 10.
- `revenuePerMonth` — `SUM(price_at_purchase × quantity)`, last 12 months.

**`deleteEvent`** — guards against deletion when `getActiveTicketCount > 0` (booked or paid tickets).

**`setTicketStatus`** — admin bypass: no business-rule restrictions. Can transition any status to any other (e.g. reactivate a cancelled ticket).

---

### `venues` module

No router — consumed by `events` and `admin` services.

**Service functions:** `getAll`, `getOrCreate` (upsert by name — used by event creation), `create` (conflicts on duplicate name), `getById`, `update` (checks name uniqueness), `deleteById`.

---

### `categories` module

No router — consumed by `events` and `admin` services.

**Service functions:** `getAll`, `getByName` (throws `NotFoundError` if absent), `getOrCreateByName`.

---

### Middleware

| File | Purpose |
|------|---------|
| `auth.middleware.ts` | Verifies Bearer JWT, attaches `req.userId` and `req.role` |
| `admin.middleware.ts` | Checks `req.role === 'admin'`; throws `ForbiddenError` otherwise |
| `validate.middleware.ts` | Strategy Pattern — accepts any `ZodSchema`, parses `req.body`, throws `BadRequestError` on failure |
| `error.middleware.ts` | Global Express error handler — maps `AppError` subclasses to HTTP status codes; generic 500 for unknowns |

### Utility Layer

**`utils/errors.ts`** — AppError hierarchy:
```
AppError (base, statusCode)
 ├─ BadRequestError   (400)
 ├─ UnauthorizedError (401)
 ├─ ForbiddenError    (403)
 ├─ NotFoundError     (404)
 └─ ConflictError     (409)
```

**`utils/response.ts`** — Factory functions:
```typescript
success<T>(message: string, data?: T) → { success: true, message, data }
apiError(message: string, errors?)    → { success: false, message, errors }
```

---

## 6. Frontend Structure

### Pages

| Route | Component | Auth | Admin |
|-------|-----------|------|-------|
| `/login` | `LoginPage` | — | — |
| `/register` | `RegisterPage` | — | — |
| `/auth/verify/:token` | `SignupConfirmPage` | — | — |
| `/signup-confirm` | `SignupConfirmPage` | — | — |
| `/forgot-password` | `ForgotPasswordPage` | — | — |
| `/auth/reset-password/:token` | `ResetPasswordPage` | — | — |
| `/` | `HomePage` | ✓ | — |
| `/events/:id` | `EventDetailPage` | ✓ | — |
| `/tickets` | `UserTicketsPage` | ✓ | — |
| `/profile` | `ProfilePage` | ✓ | — |
| `/admin/events/new` | `AdminAddEventPage` | ✓ | ✓ |
| `/admin/events/:id/edit` | `AdminEditEventPage` | ✓ | ✓ |
| `/admin/statistics` | `AdminStatisticsPage` | ✓ | ✓ |
| `/admin/users` | `AdminUsersPage` | ✓ | ✓ |
| `/admin/panel` | `AdminPanelPage` | ✓ | ✓ |
| `*` | `NotFoundPage` | — | — |

Route protection is implemented via two layout-route components:
- `PrivateRoute` — reads `isAuthenticated` from `useAuthStore`; redirects to `/login` if falsy.
- `AdminRoute` — additionally checks `role === 'admin'`; redirects to `/` if not admin.

All routes are wrapped in `ErrorBoundary` to catch runtime rendering errors.

### Admin Panel (`/admin/panel`)

A tabbed interface with three tabs:

**Events tab** — paginated table of all events with quick-edit modal (name, date, price, capacity, availability toggle) and delete with confirmation.

**Venues tab** — full CRUD table: create, edit (inline modal), delete.

**Tickets tab** — paginated table with search (user email or event name) and status filter. Columns: `#`, User, Event, Date, Qty, Price paid, Purchased, Status badge, Actions. Contextual action buttons computed via `STATUS_TRANSITIONS` lookup table:
```typescript
const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  booked:    ['paid', 'cancelled'],
  paid:      ['cancelled'],
  cancelled: ['booked'],
};
```

### Components

#### UI Primitives (`components/ui/`)

| Component | Props | Description |
|-----------|-------|-------------|
| `Button` | `variant` (primary/secondary/danger), `size` (sm/md), `isLoading`, `disabled` | Themed button with spinner during async ops |
| `Input` | React Hook Form `register` compatible; `error?: string` | Styled text input with inline error |
| `Modal` | `isOpen`, `onClose`, `title`, `children` | Accessible overlay modal with CSS-variable theming |
| `Spinner` | `size` (sm/md/lg) | Pure CSS animated spinner |
| `ErrorMessage` | `message: string` | Styled error alert block |
| `ErrorBoundary` | `children` | Class component; catches unhandled render errors |

#### Event Components (`components/events/`)

| Component | Description |
|-----------|-------------|
| `EventCard` | Displays event summary (name, date, venue, category, price, available tickets, availability badge). Links to `/events/:id`. |
| `EventFilters` | Controlled filter bar with search input, category select (loaded from `/admin/categories`), city input, date picker. Debounced URL sync. |

#### Form Components (`components/forms/`)

| Component | Description |
|-----------|-------------|
| `AuthCard` | Shared card shell (logo, title, children) used by all auth pages |
| `EventForm` | Full event creation/editing form used by both `AdminAddEventPage` and `AdminEditEventPage`. Handles: basic fields, datetime split picker (date + hour/minute selects writing to hidden RHF field via `useEffect`+`setValue`), recurring toggle with conditional fields (start/end date, frequency, repeat interval), availability checkbox. Accepts `defaultValues` for edit mode. |

---

## 7. State Management & Data Fetching

### Zustand Stores

**`auth.store.ts`** — persisted to `localStorage` under key `"auth"`:
```typescript
interface AuthState {
  userId: number | null;
  role: Role | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth(userId, role, accessToken): void;
  setAccessToken(accessToken): void;
  clearAuth(): void;
}
```

**`ui.store.ts`** — persisted under key `"ui"`:
```typescript
interface UiState {
  theme: 'light' | 'dark';
  toggleTheme(): void;
}
```
Theme is synced to `document.documentElement.setAttribute('data-theme', theme)` via `useTheme` hook in `Root.tsx`.

### TanStack Query Keys

| Query key | Data | Hook |
|-----------|------|------|
| `['events', filters]` | Paginated public events | `useEvents` |
| `['event', id]` | Single event | `useEvent` |
| `['tickets']` | Current user's tickets | `useMyTickets` |
| `['profile']` | Current user's profile | `useProfile` |
| `['admin-users', page, limit]` | Paginated user list | `useAdminUsers` |
| `['admin-events', page, limit]` | Paginated admin events | `useAdminEvents` |
| `['admin-venues']` | All venues | `useAdminVenues` |
| `['admin-tickets', page, limit, status, search]` | Paginated admin tickets | `useAdminTickets` |
| `['statistics']` | Admin statistics | `useStatistics` |

**Cross-cache invalidations** are applied on mutations where related data changes. For example, `useAdminUpdateVenue` invalidates `['admin-venues']`, `['admin-events']`, `['events']`, and `['event']` because venue data is embedded in every event response.

### Axios Client (`api/client.ts`)

- `baseURL` from `import.meta.env.VITE_API_URL`.
- `withCredentials: true` for the refresh-token cookie.
- **Request interceptor** — attaches `Authorization: Bearer <accessToken>` from Zustand store on every request.
- **Response interceptor** — on 401, queues concurrent requests, fires one `POST /auth/refresh`, updates store with new access token, replays all queued requests. On refresh failure, calls `clearAuth()` and redirects to login.

---

## 8. Authentication & Security

### Token Strategy

| Token | Algorithm | Expiry | Transport |
|-------|-----------|--------|-----------|
| Access token | HS256 (`JWT_SECRET`) | 15 minutes | `Authorization: Bearer` header |
| Refresh token | HS256 (`JWT_REFRESH_SECRET`) | 7 days | `httpOnly`, `secure`, `sameSite=strict` cookie |

### Password Policy

- Minimum 8 characters, at least one uppercase letter, at least one digit.
- Bcrypt with 12 salt rounds.

### Email Verification

New accounts cannot log in until the email link is clicked. The verification token is a `randomUUID()` stored in the `verificationToken` field. Once used, the field is set to `null`.

### Password Reset

Token-based reset via email. Token stored in `resetPasswordToken`, cleared after use.

### Route Guards

- **Backend:** `authMiddleware` (JWT check) + `adminMiddleware` (role check) compose on every protected route.
- **Frontend:** `PrivateRoute` (auth check) and `AdminRoute` (role check) are layout routes in the router tree.

### Input Validation

Every endpoint that receives a request body has a corresponding **Zod schema**. The `validate(schema)` middleware parses `req.body` before the controller is called. Invalid input returns `400 Bad Request` with structured field errors.

---

## 9. Design Patterns Applied

### Repository Pattern
Every database access is encapsulated in `*.repository.ts` files. Controllers and services **never** import `prisma` directly. This decouples business logic from persistence and makes the data layer independently testable.

```typescript
// Pattern: Repository — abstracts all Prisma calls behind a consistent interface
export const findByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });
```

### Singleton Pattern
The Prisma client is instantiated once in `config/database.ts` and re-exported. All modules import the same instance, preventing connection pool exhaustion.

```typescript
// Pattern: Singleton — one Prisma client across the application
const prisma = new PrismaClient();
export { prisma };
```

### Factory Method Pattern
`utils/response.ts` exports two factory functions that create uniformly shaped API response objects:

```typescript
// Pattern: Factory Method — centralises response shape creation
export const success = <T>(message: string, data?: T) =>
  ({ success: true, message, data });
export const apiError = (message: string, errors?: unknown) =>
  ({ success: false, message, errors });
```

### Strategy Pattern
The `validate` middleware accepts any Zod schema as its strategy argument. Different routes pass different schemas without modifying the middleware:

```typescript
// Pattern: Strategy — validate accepts any Zod schema as a validation strategy
router.post('/register', validate(registerSchema), authController.register);
router.post('/login',    validate(loginSchema),    authController.login);
```

### Chain of Responsibility Pattern (Middleware)
Express middleware chains implement the GoF Chain of Responsibility: each middleware handles one concern and passes control via `next()`:

```typescript
// Pattern: Chain of Responsibility
router.post('/', authMiddleware, adminMiddleware, validate(createEventSchema), controller.create);
```

### Observer Pattern (via TanStack Query)
TanStack Query's cache acts as an observable store. When a mutation calls `invalidateQueries`, all mounted components subscribed to that key automatically re-render with fresh data — without direct component-to-component coupling.

### Lookup Table Pattern (Status Transitions)
The Admin Panel encodes allowed ticket status transitions as a static lookup table instead of nested conditionals:

```typescript
const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  booked:    ['paid', 'cancelled'],
  paid:      ['cancelled'],
  cancelled: ['booked'],
};
```

---

## 10. SOLID Principles in Practice

### S — Single Responsibility Principle

Each module file has exactly one reason to change:

| File | Sole responsibility |
|------|-------------------|
| `*.router.ts` | HTTP route declarations and middleware attachment |
| `*.controller.ts` | Parse HTTP input, call service, format response |
| `*.service.ts` | Business logic and domain rule enforcement |
| `*.repository.ts` | Prisma/database queries |
| `*.schema.ts` | Zod validation schemas |
| `email.service.ts` | Email sending exclusively |

### O — Open/Closed Principle

- New validation rules are added by writing a new Zod schema and passing it to `validate()` — the middleware itself is never modified.
- New admin functionality is added by extending `admin.router.ts` with new routes — existing routes are unaffected.
- The `AppError` hierarchy is extended by adding new subclasses without changing the error middleware.

### L — Liskov Substitution Principle

- All repository functions return consistent, predictable shapes (`null` for not-found, typed Prisma results otherwise).
- All service functions signal errors uniformly through the `AppError` hierarchy.
- `AdminTicket extends Ticket` on the frontend — all code that handles `Ticket` also correctly handles `AdminTicket`.

### I — Interface Segregation Principle

Separate types and schemas exist for every distinct concern:

```
Backend:  RegisterDto ≠ LoginDto ≠ ResetPasswordDto
Frontend: LoginFormData ≠ RegisterFormData ≠ ResetPasswordData
Events:   CreateEventDto ≠ UpdateEventDto ≠ EventFilters
Admin:    AdminUsersQuery ≠ AdminEventsQuery ≠ AdminTicketsQuery
```

No interface forces a consumer to depend on methods it does not use.

### D — Dependency Inversion Principle

High-level modules depend on abstractions (function signatures in repository/service files), not on Prisma directly:

- Controllers import from `*.service.ts` only.
- Services import from `*.repository.ts` only.
- `admin.service.ts` delegates venue/category operations to `venues.service.ts` and `categories.service.ts`, not to their repositories.

---

## 11. Refactoring & Clean Code

### Key Refactorings Applied

| Original (problematic) | Refactored (clean) |
|------------------------|-------------------|
| Raw SQL/manual DB calls in route files | Prisma ORM calls isolated in `*.repository.ts` |
| HTML email markup in TypeScript strings | Separate `.html` template files in `emails/templates/` |
| `useState` per form field | React Hook Form + Zod (`zodResolver`) |
| Redux Toolkit + RTK Query | Zustand + TanStack Query (simpler, less boilerplate) |
| `available_tickets` stored as mutable column | Computed at query time via `groupBy` / `aggregate` |
| No price snapshot on tickets | `price_at_purchase` field snapshotted at booking time |
| Circular FK between RecurringEvent and Event | One-direction reference (RecurringEvent → Event) |
| `// @ts-ignore` suppressions | Proper TypeScript types throughout |
| No input validation | Zod schemas on every endpoint, mirrored on frontend |
| No error handling | Global error middleware + `AppError` hierarchy |
| `datetime-local` input (unreliable in Chrome) | Split date picker + hour/minute selects combined via `useEffect` |
| Hardcoded hex colors in SCSS | CSS custom properties (`var(--color-*)`) with `[data-theme='dark']` overrides |

### Clean Code Principles Demonstrated

**Meaningful names:** `computeMaxPerUser`, `ticketAdminInclude`, `REFRESH_COOKIE_OPTS`, `STATUS_TRANSITIONS`, `signAccess`, `signRefresh` — every identifier describes its purpose.

**No magic numbers:** Constants are named:
```typescript
const BCRYPT_ROUNDS = 12;
const computeMaxPerUser = (capacity: number) => Math.ceil(capacity * 0.1);
```

**Single-purpose functions:** `signAccess` only signs access tokens; `signRefresh` only signs refresh tokens; they are not combined into a single `signTokens` function.

**Early returns over nesting:**
```typescript
if (!event) throw new NotFoundError('Event not found');
if (!event.isAvailable) throw new BadRequestError('Event is not available');
if (available < dto.quantity) throw new BadRequestError(`Only ${available} ticket(s) remaining`);
// happy path below
```

**No dead code:** No commented-out code, no `// @ts-ignore`, no unused imports.

**Self-documenting JSDoc on exported service/repository functions:**
```typescript
/**
 * Books tickets for a user.
 * Validates availability, snapshots the current price, and creates a ticket record.
 * @throws {NotFoundError} if event does not exist
 * @throws {BadRequestError} if event is unavailable or insufficient tickets remain
 */
export const book = async (userId: number, dto: BookDto) => { ... }
```

### TypeScript Strict Mode

`tsconfig.json` enables `"strict": true`. All function parameters and return types are explicitly typed. `any` is never used. The compiler enforces null safety throughout.

---

## 12. Deployment & Configuration

### Environment Variables

**Backend** (`.env`):
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
FRONTEND_URL=https://your-site.netlify.app
NODE_ENV=production
PORT=4000
```

**Frontend** (`.env`):
```
VITE_API_URL=https://your-api.onrender.com/api
```

### Production Services

| Service | Platform | Details |
|---------|----------|---------|
| Database | Neon (PostgreSQL serverless) | Connection pooling via `DATABASE_URL` |
| Backend API | Render (Node.js Web Service) | Auto-deploy on `main` branch push |
| Frontend | Netlify (static site) | `npm run build` → `dist/` directory |

### CORS Configuration

`config/cors.ts` allows requests from `FRONTEND_URL` with credentials. `Access-Control-Allow-Credentials: true` is required for the refresh-token cookie.

### Database Migrations

Managed by Prisma Migrate. Single initial migration at `prisma/migrations/20260424170512_init/migration.sql` creates all 6 tables with proper foreign key constraints and cascade rules.

To apply migrations in production:
```bash
npx prisma migrate deploy
```

### Testing

**Backend:** Jest + ts-jest + Supertest. Tests cover service and repository layers.

**Frontend:** Vitest + Testing Library + MSW (Mock Service Worker). MSW handlers in `test/handlers.ts` mock the REST API. `renderWithProviders` helper wraps components with `QueryClient`, `MemoryRouter`, and `ToastContainer`. Key test files:
- `router/PrivateRoute.test.tsx`
- `router/AdminRoute.test.tsx`
- `pages/HomePage.test.tsx`
- `pages/EventDetailPage.test.tsx`
- `pages/LoginPage.test.tsx`
- `pages/RegisterPage.test.tsx`
- `hooks/useAuth.test.tsx`
- `hooks/useEvents.test.tsx`

---

*Generated: 2026-04-28 | NURE · Group ITIНФ-23-2 · Theory of Programming*
