# TindaTrack

TindaTrack is a mobile-first inventory and sales management system built for small local retail stores such as sari-sari stores.

The project focuses on inventory correctness, transactional sales, auditability, role-based access, and a practical full-stack deployment rather than broad accounting or e-commerce features.

## Live Demo

**Frontend**

https://tindatrack.pages.dev/

**API Health**

https://tindatrack-production-1d8a.up.railway.app/health

### Production Hosting

```text
Frontend
→ Cloudflare Pages

Backend
→ Railway

Database
→ Railway PostgreSQL
```

---

## Engineering Guarantees

TindaTrack is intentionally designed around a few important invariants.

### Inventory is derived, not edited

Product inventory is never stored as a mutable `stock` field.

Current stock is calculated from the stock movement ledger:

```text
current_stock =
SUM(stock_movements.quantity_delta)
```

Inventory can only change through traceable business operations:

```text
Stock Receipt
→ positive movement

Sale
→ negative movement

Adjustment In
→ positive movement

Adjustment Out
→ negative movement
```

This prevents inventory from changing without evidence of why it changed.

### Sales are transactional

A sale and its inventory effects are treated as one operation.

Conceptually:

```text
Begin transaction
        ↓
Load authoritative product data
        ↓
Validate stock
        ↓
Calculate prices and totals
        ↓
Create Sale
        ↓
Create SaleItems
        ↓
Create StockMovements
        ↓
Write audit evidence
        ↓
Commit
```

If any required step fails:

```text
Rollback everything
```

A partially recorded sale must never exist.

### The server owns prices and totals

The client submits:

```text
productId
quantity
paymentMethod
```

The server reloads authoritative product prices and calculates:

```text
unit price
line totals
sale total
```

Client-calculated totals are never trusted.

### Insufficient stock aborts the sale

A sale cannot commit when the required inventory is unavailable.

The sale, sale items, and stock movements are rolled back together.

### Historical prices are preserved

`SaleItem.unit_price` stores the price used when the transaction occurred.

Changing a product's current selling price does not rewrite historical sales.

### Authorization is enforced by the API

TindaTrack supports:

```text
OWNER
STAFF
```

Frontend route protection improves the user experience, but the backend remains the actual authorization boundary.

OWNER-only operations are enforced on the API.

---

## Features

### Public

- Public landing page
- First-owner setup
- Login
- Authentication persistence

### Operations

- Role-aware dashboard
- Inventory view
- New sale
- Stock receiving
- Stock adjustment
- Low-stock visibility

### Management

OWNER users can manage:

- Products
- Suppliers
- Staff accounts

Historical entities are generally deactivated rather than deleted when preserving transaction history matters.

### Evidence and Reporting

- Daily Sales report
- Stock movement history
- Audit history
- Server-derived inventory state

### Output

- Printable sale receipts
- Daily Sales print / Save as PDF
- Daily Sales CSV export

---

## Roles

### OWNER

The OWNER has access to store-wide management and evidence features, including:

- product management
- supplier management
- staff management
- stock adjustments
- reports
- movement history
- audit history
- store-wide dashboard information

### STAFF

STAFF users focus on daily operations such as:

- inventory viewing
- sales
- stock receiving
- role-appropriate dashboard information

Restricted actions are enforced by backend RBAC.

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Vitest
- React Testing Library

### Backend

- Node.js
- Express
- TypeScript
- Zod
- JOSE JWT authentication
- Vitest
- Supertest

### Database

- PostgreSQL
- Prisma ORM
- Prisma PostgreSQL adapter

### Deployment

- Cloudflare Pages
- Railway
- Railway PostgreSQL

---

## System Architecture

TindaTrack is intentionally implemented as a modular monolith.

```text
React / TypeScript
        ↓
HTTP API
        ↓
Express Routes
        ↓
Validation
        ↓
Authentication / RBAC
        ↓
Services
        ↓
Repositories
        ↓
Prisma
        ↓
PostgreSQL
```

Responsibilities are separated without introducing unnecessary distributed-system complexity.

The backend follows the general flow:

```text
routes
→ validation
→ authentication / authorization
→ services
→ repositories
→ database
```

Business transaction rules belong in the service layer rather than controllers or frontend code.

---

## Inventory Model

Inventory is modeled as a ledger.

The main record is:

```text
StockMovement
```

Each movement contains a signed quantity delta.

Examples:

```text
Receipt
+10

Sale
-3

Adjustment In
+2

Adjustment Out
-1
```

Current stock is therefore:

```text
10 - 3 + 2 - 1 = 8
```

There is deliberately no editable:

```text
Product.stock
```

field.

Each movement is linked back to the business event that caused it, such as:

```text
SaleItem
StockReceiptItem
StockAdjustment
```

This provides traceability between inventory state and operational evidence.

---

## Transaction Integrity

Sales are one of the most important transactional boundaries in TindaTrack.

The server performs the sale using authoritative data rather than trusting client calculations.

Conceptually:

```text
Begin transaction
        ↓
Load requested products
        ↓
Reject missing or inactive products
        ↓
Read authoritative selling prices
        ↓
Calculate line totals
        ↓
Calculate server total
        ↓
Calculate current inventory
        ↓
Reject insufficient stock
        ↓
Create Sale
        ↓
Create SaleItems
        ↓
Create matching StockMovements
        ↓
Create audit evidence
        ↓
Commit
```

Any failure causes the transaction to roll back.

This protects against states such as:

```text
Sale exists
but inventory did not decrease
```

or:

```text
Inventory decreased
but SaleItem creation failed
```

Concurrency-sensitive inventory behavior is also covered by backend tests.

---

## Data Model

The core domain includes:

```text
User
Product
Supplier

StockReceipt
StockReceiptItem

Sale
SaleItem

StockAdjustment

StockMovement

AuditLog
```

Money is stored using PostgreSQL:

```text
NUMERIC(12,2)
```

rather than floating-point database types.

Transaction-related foreign keys generally use:

```text
ON DELETE RESTRICT
```

to protect historical evidence.

---

## Authentication

TindaTrack uses JWT bearer authentication.

```text
Login
        ↓
Server authenticates credentials
        ↓
Server issues JWT
        ↓
Frontend stores authentication session
        ↓
Requests send:

Authorization: Bearer <token>
```

The server re-validates authenticated users and their active state for protected requests.

An inactive user therefore loses access rather than retaining authorization indefinitely from stale client state.

---

## Local Development

### Requirements

Install:

- Node.js
- npm
- PostgreSQL

Clone the repository and install workspace dependencies:

```bash
npm install
```

### Server Environment

Copy:

```text
server/.env.example
```

to:

```text
server/.env
```

Configure at least:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
PORT=3000
CLIENT_ORIGIN="http://localhost:5173"
```

Use a dedicated local PostgreSQL database such as:

```text
tindatrack_dev
```

### Client Environment

The frontend can use the existing Vite development proxy, so a client `.env` is optional for normal local development.

If used:

```env
VITE_API_BASE_URL=""
```

The Vite development server proxies `/api` requests to the local Express server.

### Generate Prisma Client

From the repository root:

```bash
npm run db:generate --workspace server
```

### Apply Development Migrations

From the `server/` directory:

```bash
npx prisma migrate dev --config prisma7.config.ts
```

`prisma migrate dev` is development-only.

Production uses:

```text
prisma migrate deploy
```

### Optional Development Seed

```bash
npm run db:dev:seed --workspace server
```

### Start the Backend

From the repository root:

```bash
npm run dev:server
```

### Start the Frontend

In a second terminal:

```bash
npm run dev:client
```

The default local development URLs are:

```text
Frontend
http://localhost:5173

Backend
http://localhost:3000
```

---

## Environment Configuration

### Backend

The server uses:

```text
DATABASE_URL
JWT_SECRET
CLIENT_ORIGIN
PORT
NODE_ENV
```

Production startup validates required configuration and fails clearly when required values are missing or invalid.

### Frontend

The production frontend uses:

```text
VITE_API_BASE_URL
```

This value points to the deployed Express API.

`VITE_*` values are embedded into the frontend bundle and must never contain secrets.

---

## Testing

TindaTrack uses separate backend and frontend test suites because they protect different responsibilities.

Run all tests from the repository root:

```bash
npm run test
```

### Backend Tests

Backend tests focus on system and business integrity, including areas such as:

- API validation
- authentication
- authorization / RBAC
- stock receipts
- stock adjustments
- sales
- inventory behavior
- insufficient-stock rollback
- transaction integrity
- concurrency-sensitive sale behavior
- reporting and evidence behavior

Integration tests use a dedicated PostgreSQL test database.

The test setup refuses to run against a database whose name does not end in:

```text
_test
```

to reduce the risk of destructive test operations against development data.

### Frontend Tests

Frontend tests focus on critical user workflows rather than visual implementation details.

Current coverage includes:

- root/setup/auth routing
- OWNER vs STAFF route behavior
- landing page navigation
- login success, loading, and errors
- sale request integrity
- server-authoritative receipt rendering
- receipt printing trigger
- stock receiving
- unit-cost validation
- stock adjustments
- destructive confirmation behavior
- staff management confirmation behavior

The frontend tests intentionally avoid assertions based on Tailwind class names or responsive layout implementation.

### Other Validation

Build both workspaces:

```bash
npm run build
```

Run frontend linting:

```bash
npm run lint
```

---

## Deployment

Production uses:

```text
Cloudflare Pages
→ React/Vite frontend

Railway
→ Node/Express backend

Railway PostgreSQL
→ production database
```

The backend deployment runs committed Prisma migrations using:

```bash
npm run db:migrate:deploy --workspace server
```

Railway uses:

```text
GET /health
```

as the API health-check endpoint.

The Cloudflare Pages deployment supports React Router SPA deep links, including direct requests and refreshes on routes such as:

```text
/inventory
/reports
/sales/new
```

For the complete deployment setup, see:

[`docs/deployment.md`](docs/deployment.md)

---

## Project Scope

TindaTrack intentionally focuses on the operational core of a small retail store.

### Included

- inventory tracking
- sales
- receiving
- stock adjustments
- products
- suppliers
- staff users
- RBAC
- reporting
- audit evidence
- printable operational output

### Non-Goals

The current project intentionally does not attempt to become:

- a full accounting system
- an e-commerce storefront
- a payroll system
- a multi-tenant SaaS platform
- a barcode hardware platform
- a microservice architecture
- an ERP

These features would add complexity without strengthening the main engineering goals of the project.

---

## Documentation

More detailed design documentation is available under `docs/`.

- [`Database Design`](docs/database-design.md) — schema rules, constraints, indexes, numeric types, and enforcement layers
- [`Domain Model`](docs/domain-model.md) — business concepts and relationships
- [`ERD`](docs/erd.md) — entity relationships
- [`Project Stories`](docs/project-stories.md) — functional scope and workflows
- [`UI Workspace`](docs/ui-workspace.md) — application workspace and interaction structure
- [`UI Color Theme`](docs/ui-color-theme.md) — semantic visual system and design tokens
- [`Deployment`](docs/deployment.md) — Cloudflare Pages, Railway, PostgreSQL, environment configuration, migrations, health checks, and SPA behavior

---

## Repository Structure

```text
TindaTrack/
├── client/
│   └── React + TypeScript frontend
│
├── server/
│   ├── prisma/
│   └── Node + Express + Prisma backend
│
├── docs/
│   └── architecture and design documentation
│
├── package.json
└── README.md
```

---

## Status

TindaTrack has completed its core MVP implementation and production deployment.

The current system includes the inventory, receiving, sales, adjustment, reporting, audit, role-management, testing, and deployment foundations required for the intended portfolio scope.