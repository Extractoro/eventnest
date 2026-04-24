# CLAUDE.md — EventNest Project Instructions

This file is read automatically by Claude Code at the start of every session.
Follow ALL rules in this file without exception.

---

## Project Context

This is a university course project for the discipline **"Theory of Programming"** (Теорія програмування), NURE, group ITIНФ-23-2, 2026.

The project is graded on the following criteria (see full spec in `EventNest_Spec.md`):
- Clean Code principles
- SOLID principles
- Refactoring
- Clean Architecture
- Design Patterns
- Code quality and structure

**Every architectural and naming decision must be made with these grading criteria in mind.**

---

## Grading Criteria Mapping

The course work is graded on these sections. Every section must be demonstrable in the code:

### Section 1.1 — Clean Code
Every piece of code written must follow Clean Code rules:
- **Meaningful names**: variables, functions, classes must have clear, descriptive names. No `a`, `b`, `tmp`, `data`, `result` as standalone names.
- **Functions do one thing**: every function has a single responsibility. If a function name needs "and" to describe it, split it.
- **No magic numbers**: all numeric constants must be named. Example: use `const MAX_TICKETS_PER_BOOKING = 20` not `if (quantity > 20)`.
- **No dead code**: never leave commented-out code in the repository.
- **No `// @ts-ignore`**: fix the type, never suppress it.
- **Self-documenting code**: code should read like prose. Comments explain WHY, not WHAT.
- **Short functions**: functions should be 20 lines max where possible. If longer, extract helpers.
- **No deeply nested code**: max 2-3 levels of nesting. Use early returns.

```typescript
// BAD — magic number, unclear name, nested logic
async function proc(u: any, e: any, q: any) {
  if (q > 0) {
    if (q <= 20) {
      // do stuff
    }
  }
}

// GOOD — meaningful names, constants, early returns
const MAX_TICKETS_PER_BOOKING = 20;

async function bookTickets(userId: number, eventId: number, quantity: number) {
  if (quantity <= 0) throw new AppError('Quantity must be positive', 400);
  if (quantity > MAX_TICKETS_PER_BOOKING) throw new AppError(`Max ${MAX_TICKETS_PER_BOOKING} tickets per booking`, 400);
  // ...
}
```

### Section 1.2 — Functions
- Functions must be **pure where possible**: same input → same output, no side effects
- Functions must have **typed parameters and return types** — no `any`
- **Avoid output arguments**: don't modify parameters passed in
- **Command-Query Separation**: a function either does something (command) or returns something (query), not both

### Section 1.3 — SOLID Principles

Each principle must be visibly applied in the architecture:

**S — Single Responsibility Principle**
Each class/module has exactly one reason to change:
- `auth.router.ts` — only HTTP routing
- `auth.controller.ts` — only HTTP parsing and response
- `auth.service.ts` — only business logic
- `auth.repository.ts` — only database access
- `email.service.ts` — only email sending

**O — Open/Closed Principle**
Code is open for extension, closed for modification:
- Use interfaces for services so they can be extended without changing callers
- Middleware is composable — add new validation without changing existing routes

**L — Liskov Substitution Principle**
- Repository functions return consistent types
- Error handling is uniform across all modules (AppError hierarchy)

**I — Interface Segregation Principle**
- Separate TypeScript interfaces for different concerns:
  - `CreateEventDto` ≠ `UpdateEventDto` ≠ `EventResponse`
  - `RegisterDto` ≠ `LoginDto` ≠ `UserResponse`

**D — Dependency Inversion Principle**
- Services depend on repository functions (abstractions), not on Prisma directly
- Controllers depend on services, not on repositories
- High-level modules never import from low-level modules

### Section 1.4 — Design Patterns

The following patterns must be present and documented in code comments:

**Repository Pattern** — `*.repository.ts` files
```typescript
// Pattern: Repository
// Abstracts all database access behind a consistent interface.
// Controllers and services never call Prisma directly.
export const findByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });
```

**Middleware Pattern** — `middleware/*.ts` files
```typescript
// Pattern: Chain of Responsibility (Middleware)
// Each middleware handles one concern and passes to the next.
export const validate = (schema: ZodSchema) => (req, res, next) => { ... };
```

**Factory/Builder Pattern** — response helpers
```typescript
// Pattern: Factory Method
// Centralizes response object creation to ensure consistent shape.
export const success = <T>(message: string, data?: T) => ({ success: true, message, data });
export const apiError = (message: string, errors?: unknown) => ({ success: false, message, errors });
```

**Singleton Pattern** — Prisma client
```typescript
// Pattern: Singleton
// Ensures only one Prisma client instance exists across the application.
const prisma = new PrismaClient();
export default prisma;
```

**Strategy Pattern** — validation middleware
```typescript
// Pattern: Strategy
// Validate middleware accepts any Zod schema as a strategy.
router.post('/register', validate(registerSchema), registerController);
router.post('/login',    validate(loginSchema),    loginController);
```

### Section 1.5 — Clean Architecture

The project uses strict **Layered Architecture** with dependency rules:

```
HTTP Layer    →  Controller  →  Service  →  Repository  →  Database
(router.ts)    (controller.ts) (service.ts) (repository.ts) (Prisma/PostgreSQL)
```

Rules that must never be violated:
- A **router** never calls a repository or service directly — only attaches middleware and calls controller
- A **controller** never calls a repository — only calls service
- A **service** never imports `Request` or `Response` from Express
- A **repository** never contains business logic — pure data access only
- **Cross-module imports** are forbidden: `auth.service.ts` must not import from `events.service.ts` directly

### Section 1.6 — Refactoring

The project is a deliberate refactor of the original codebase. The following refactorings must be applied and can be described in the course work:

| Original (bad) | Refactored (good) |
|---|---|
| Raw SQL in route files | Prisma in repository layer |
| HTML email templates in TypeScript | Separate `.html` template files |
| Manual form state with `useState` | React Hook Form + Zod |
| Redux Toolkit + RTK Query | Zustand + TanStack Query |
| `available_tickets` mutable counter | Computed from tickets via `groupBy` |
| No price snapshot on tickets | `price_at_purchase` field |
| Circular FK in RecurringEvents | One-direction reference |
| `// @ts-ignore` suppressions | Proper TypeScript types |
| No input validation | Zod schemas on every endpoint |
| No error handling | Global error middleware + AppError hierarchy |

---

## Coding Standards

### TypeScript
- **Strict mode is ON** — `tsconfig.json` must have `"strict": true`
- **No `any`** — every value must be typed
- **No `// @ts-ignore`** — ever
- Use `type` for simple shapes, `interface` for extendable structures
- Always type function parameters AND return types explicitly

### Naming Conventions
```
Files:        kebab-case         auth.service.ts, event.repository.ts
Classes:      PascalCase         EmailService, AppError
Functions:    camelCase          findByEmail, bookTickets
Constants:    SCREAMING_SNAKE    MAX_TICKETS_PER_BOOKING, JWT_EXPIRES_IN
Types/Interfaces: PascalCase     RegisterDto, EventResponse, AuthState
Zod schemas:  camelCase + Schema registerSchema, bookTicketSchema
```

### Comments
- **JSDoc for all exported functions** in service and repository layers:
```typescript
/**
 * Books tickets for a user.
 * Validates availability, snapshots the current price, and creates a ticket record.
 * @throws {NotFoundError} if event does not exist
 * @throws {AppError} if event is unavailable or insufficient tickets remain
 */
export const bookTickets = async (userId: number, eventId: number, quantity: number) => { ... }
```
- **Pattern comments** on classes and key functions (see Section 1.4 above)
- **No obvious comments**: `// increment i` above `i++` is noise, delete it

### Error Handling
- **Always use the AppError hierarchy**, never throw raw strings or generic Errors:
```typescript
// BAD
throw new Error('Not found');
throw 'unauthorized';

// GOOD
throw new NotFoundError('Event not found');
throw new UnauthorizedError('Invalid token');
throw new ConflictError('Email already in use');
```
- **Every async function** in service and repository layers must propagate errors to the global error handler (no silent catches)
- **Never swallow errors** with empty `catch` blocks

### Validation
- **Every API endpoint** that receives input must have a Zod schema
- Schemas are defined in `*.schema.ts` files, never inline in controllers
- Frontend forms use `zodResolver` from `@hookform/resolvers/zod`

---

## Project Structure Rules

### Backend module structure (MANDATORY for every module)
Every module MUST have exactly these 5 files:
```
modules/[name]/
  [name].router.ts      # Express routes only
  [name].controller.ts  # HTTP parsing + response only
  [name].service.ts     # Business logic only
  [name].repository.ts  # Prisma queries only
  [name].schema.ts      # Zod validation schemas
```
Optional: `[name].types.ts` for TypeScript interfaces specific to this module.

### What goes where — strict rules

| What | Where | Never |
|---|---|---|
| `prisma.*` calls | `*.repository.ts` only | in controller, service, router |
| `req`, `res`, `next` | `*.controller.ts`, `*.middleware.ts`, `*.router.ts` | in service, repository |
| Business logic | `*.service.ts` only | in controller, repository, router |
| Zod schemas | `*.schema.ts` only | inline in controllers |
| Error throwing | `*.service.ts` (mainly) | in repository (just propagate) |
| JWT sign/verify | `auth.service.ts`, `auth.middleware.ts` | anywhere else |
| Email sending | `email.service.ts` only | in route handlers |

---

## Database Rules

- **Never use raw SQL** — Prisma only
- `available_tickets` is **not stored** — always computed:
  ```typescript
  available = capacity_event - SUM(tickets.quantity WHERE status != 'cancelled')
  ```
- `price_at_purchase` is set **once at booking time** from `event.ticket_price` — **never modified after**
- `quantity` on Ticket represents seats in one booking action — default 1
- When fetching events list, use `groupBy` to compute available seats **in one query** (avoid N+1)

---

## Frontend Rules

- **No `useState` for form fields** — use React Hook Form only
- **No direct API calls in components** — use custom hooks from `hooks/` folder
- **No business logic in page components** — pages compose components only
- **No hardcoded API URLs** — always use `import.meta.env.VITE_API_URL` via `api/client.ts`
- **TanStack Query for all server state** — no manual loading/error state
- **Zustand for client state** — no Redux

---

## What to Output When Writing Code

When implementing a new module or feature, always:

1. **Create all 5 module files** — never partial implementations
2. **Add JSDoc comments** to all exported service and repository functions
3. **Add pattern comments** where Design Patterns are applied
4. **Write the Zod schema first**, then the service, then the controller
5. **Export types** for request DTOs and response shapes in `*.types.ts`
6. **Register the router** in `app.ts` after creating it

---

## Deployment

- **Database**: PostgreSQL on Neon (serverless)
- **Backend**: Render (Node.js Web Service)
- **Frontend**: Netlify (static site)
- See `EventNest_Spec.md` Part 0 for manual setup steps

---

## Spec File

Full project specification is in `EventNest_Spec.md` in the project root.
Read it before starting any phase. Follow the Implementation Checklist in Part 10.
