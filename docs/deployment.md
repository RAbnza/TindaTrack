

# TindaTrack Deployment Guide

This document describes the production deployment architecture and configuration used by TindaTrack.

TindaTrack is deployed as a simple three-part application:

```text
Frontend
→ Cloudflare Pages

Backend
→ Railway

Database
→ Railway PostgreSQL
```

The application remains a modular monolith.

No Kubernetes, microservices, or container orchestration are required for the current project scope.

---

## Live Deployment

Frontend:
https://your-project.pages.dev

Backend health:
https://your-api.up.railway.app/health


---

## Production Architecture

```text
┌────────────────────────────────────┐
│ Cloudflare Pages                   │
│                                    │
│ React + TypeScript + Vite          │
│ React Router BrowserRouter         │
│ SPA deep-link fallback             │
│                                    │
│ VITE_API_BASE_URL                  │
└─────────────────┬──────────────────┘
                  │
                  │ HTTPS
                  │ Authorization: Bearer <JWT>
                  ▼
┌────────────────────────────────────┐
│ Railway                            │
│                                    │
│ Node.js + Express                  │
│ CORS                               │
│ JWT authentication                 │
│ /health                            │
│                                    │
│ CLIENT_ORIGIN                      │
│ JWT_SECRET                         │
│ PORT                               │
└─────────────────┬──────────────────┘
                  │
                  │ DATABASE_URL
                  ▼
┌────────────────────────────────────┐
│ Railway PostgreSQL                 │
│                                    │
│ PostgreSQL                         │
│ Prisma ORM                         │
│ committed migrations              │
└────────────────────────────────────┘
```

---

# Frontend Deployment

The frontend is located in:

```text
client/
```

and is deployed to **Cloudflare Pages**.

## Build Command

Cloudflare Pages builds the frontend from the repository workspace using:

```bash
npm run build --workspace client
```

## Build Output

The Vite production build is generated in:

```text
client/dist
```

Cloudflare Pages publishes this directory as the production frontend.

---

## Frontend Environment

The production frontend requires:

```text
VITE_API_BASE_URL
```

It points to the deployed Railway backend.

Example:

```env
VITE_API_BASE_URL="https://<railway-backend>.up.railway.app"
```

The value should contain the backend origin only.

Do not append `/api`.

For example:

```text
VITE_API_BASE_URL
https://example.up.railway.app

Application request
/api/products

Final request
https://example.up.railway.app/api/products
```

`VITE_API_BASE_URL` is public frontend configuration and is embedded into the Vite build.

Secrets must never be placed in `VITE_*` environment variables.

This includes:

- `JWT_SECRET`
- `DATABASE_URL`
- database passwords
- private credentials

---

# React Router SPA Fallback

TindaTrack uses React Router with:

```text
BrowserRouter
```

This means frontend routes are resolved by React rather than corresponding to physical files on the static host.

Examples include:

```text
/dashboard
/inventory
/products
/suppliers
/staff
/sales/new
/receiving
/adjustments
/reports
/movements
/audit
```

A direct request such as:

```text
GET /reports
```

must still serve the frontend application.

The production request flow is:

```text
Browser requests:

/reports

        ↓

Cloudflare Pages

        ↓

SPA fallback

        ↓

index.html

        ↓

React application loads

        ↓

BrowserRouter resolves /reports

        ↓

Daily Sales page renders
```

Cloudflare Pages provides SPA fallback behavior for this deployment, so no provider-specific `vercel.json`, `netlify.toml`, or similar rewrite configuration is required.

Production deployment has been verified to support direct navigation and browser refreshes on application routes.

---

# Backend Deployment

The backend is located in:

```text
server/
```

and is deployed as a Node.js service on **Railway**.

---

## Railway Build Command

The Railway backend build runs:

```bash
npm run db:generate --workspace server && npm run build --workspace server
```

This performs:

```text
Prisma Client generation
        ↓
TypeScript compilation
```

---

## Railway Pre-Deploy Command

Before a new backend deployment becomes active, Railway runs:

```bash
npm run db:migrate:deploy --workspace server
```

This ultimately runs:

```bash
prisma migrate deploy
```

against the production database.

The pre-deploy migration step ensures committed schema migrations are applied before the new application version begins serving traffic.

Production deployment must never use:

```bash
prisma migrate dev
```

`prisma migrate dev` remains development-only.

---

## Railway Start Command

The production server starts using:

```bash
npm run start --workspace server
```

which runs the compiled Node.js server.

---

# Backend Environment Variables

The Railway backend requires the following production environment configuration:

```text
DATABASE_URL
JWT_SECRET
CLIENT_ORIGIN
NODE_ENV
PORT
```

## DATABASE_URL

The production `DATABASE_URL` comes from the Railway PostgreSQL service.

The backend service references the PostgreSQL connection variable rather than committing database credentials to the repository.

Conceptually:

```text
DATABASE_URL
→ Railway PostgreSQL connection string
```

The actual connection string and credentials must remain private.

---

## JWT_SECRET

`JWT_SECRET` is a production-only secret used to sign and verify authentication tokens.

It must:

- be at least 32 characters long
- use a strong randomly generated value
- not reuse the local development secret
- never be committed to Git

---

## CLIENT_ORIGIN

`CLIENT_ORIGIN` contains the deployed Cloudflare Pages frontend origin.

Example:

```env
CLIENT_ORIGIN="https://<project>.pages.dev"
```

It must contain the origin only.

Correct:

```text
https://example.pages.dev
```

Avoid:

```text
https://example.pages.dev/
https://example.pages.dev/dashboard
*
```

The Express CORS configuration uses this value to permit browser requests from the deployed frontend.

---

## NODE_ENV

Production uses:

```env
NODE_ENV="production"
```

This also causes production environment validation to require the deployment-specific configuration.

---

## PORT

The Express application reads:

```text
PORT
```

from the environment.

Railway supplies the service port at deployment time, so a hard-coded production port is not required.

For local development, the default remains:

```text
3000
```

---

# CORS

The frontend and backend use different production origins:

```text
Cloudflare Pages
https://<frontend>.pages.dev

        ↓ HTTPS

Railway
https://<backend>.up.railway.app
```

The backend CORS policy allows requests from:

```text
CLIENT_ORIGIN
```

rather than opening the API to all browser origins.

The production configuration must not use:

```text
Access-Control-Allow-Origin: *
```

for the application frontend.

---

# PostgreSQL

Production PostgreSQL is hosted by **Railway PostgreSQL**.

The backend communicates with PostgreSQL through:

```text
DATABASE_URL
```

The database is not accessed directly by the browser.

The flow is:

```text
Cloudflare frontend
        ↓
Railway Express API
        ↓
Prisma
        ↓
Railway PostgreSQL
```

Only the backend owns database access.

---

# Prisma Production Migrations

All production schema changes are represented by committed Prisma migrations.

The production migration command is:

```bash
npm run db:migrate:deploy
```

or directly through the server workspace:

```bash
npm run db:migrate:deploy --workspace server
```

This runs:

```bash
prisma migrate deploy --config prisma7.config.ts
```

The deployment flow is:

```text
Committed migration files
        ↓
Railway deployment begins
        ↓
Prisma Client generation
        ↓
Server build
        ↓
Railway pre-deploy command
        ↓
prisma migrate deploy
        ↓
Migration succeeds
        ↓
New Express deployment starts
```

Migration creation continues to happen only during development.

---

# Health Check

The backend exposes:

```text
GET /health
```

A healthy deployment returns:

```json
{
  "status": "ok"
}
```

Railway uses `/health` as the backend health-check path.

This endpoint intentionally does not expose:

- database credentials
- JWT secrets
- environment variables
- user information
- database contents
- internal infrastructure details

Its purpose is only to confirm that the API process is alive and accepting requests.

---

# Authentication

TindaTrack uses bearer-token authentication.

The production authentication flow is:

```text
User logs in
        ↓
Railway Express API authenticates credentials
        ↓
Server returns JWT
        ↓
Frontend stores the authentication session
        ↓
Authenticated requests send:

Authorization: Bearer <token>
```

Authentication cookies are not currently used.

Because of this:

- API requests do not require `credentials: "include"`
- SameSite authentication-cookie configuration is not required
- credentialed-cookie CORS configuration is not required
- frontend and backend production traffic should use HTTPS

The production `JWT_SECRET` must remain private.

---

# Production Environment Summary

## Cloudflare Pages

```text
Platform:
Cloudflare Pages

Source:
GitHub repository

Production branch:
main

Build:
npm run build --workspace client

Output:
client/dist

Environment:
VITE_API_BASE_URL=https://<railway-backend>
```

---

## Railway Backend

```text
Platform:
Railway

Source:
GitHub repository

Build:
npm run db:generate --workspace server &&
npm run build --workspace server

Pre-deploy:
npm run db:migrate:deploy --workspace server

Start:
npm run start --workspace server

Health check:
/health

Environment:
DATABASE_URL
JWT_SECRET
CLIENT_ORIGIN
NODE_ENV
PORT
```

---

## Railway PostgreSQL

```text
Platform:
Railway PostgreSQL

Consumed by:
Express backend only

Connection:
DATABASE_URL

Schema management:
Prisma migrations
```

---

# Deployment Sequence

The production deployment was configured in the following order:

```text
1. Create Railway project.

2. Provision Railway PostgreSQL.

3. Create Railway backend service from the GitHub repository.

4. Configure Railway backend environment variables.

5. Configure the Prisma Client generation and backend build command.

6. Configure:
   prisma migrate deploy
   as the Railway pre-deploy command.

7. Configure:
   npm run start --workspace server
   as the production start command.

8. Configure /health as the Railway health check.

9. Deploy the backend.

10. Generate the Railway backend public domain.

11. Verify GET /health.

12. Create the Cloudflare Pages project from the same GitHub repository.

13. Configure:
    npm run build --workspace client

14. Configure:
    client/dist
    as the frontend build output.

15. Configure VITE_API_BASE_URL
    with the Railway backend origin.

16. Deploy the frontend.

17. Configure Railway CLIENT_ORIGIN
    with the Cloudflare Pages frontend origin.

18. Redeploy the backend with the final CORS configuration.

19. Verify authentication, API requests, database access,
    and SPA deep links.
```

---

# Production Verification

The deployed application should be verified through the complete business workflow rather than only checking that the landing page loads.

## Infrastructure

Verify:

- Cloudflare Pages frontend is reachable over HTTPS.
- Railway backend is reachable over HTTPS.
- `GET /health` returns HTTP 200.
- Railway PostgreSQL is reachable by the backend.
- Prisma migrations have been applied successfully.
- Production environment validation passes.

## Authentication

Verify:

- first-owner setup works against a fresh production database
- OWNER login works
- STAFF login works
- sign-out works
- protected API requests use the bearer token
- unauthenticated protected routes redirect appropriately

## Inventory Flow

Verify:

```text
Create product
        ↓
Create supplier
        ↓
Receive stock
        ↓
Inventory reflects stock movement
        ↓
Record sale
        ↓
Inventory decreases
        ↓
Movement history records evidence
```

Inventory quantities must continue to be derived from stock movements rather than edited directly.

## Sales

Verify:

- sale recording works
- stock validation works
- successful sales generate movement records
- sale receipt renders from server-returned data
- receipt printing works
- Daily Sales reporting works

## SPA Deep Links

Directly open and refresh routes such as:

```text
/inventory
/reports
/sales/new
```

They must load the React application rather than returning a static-host 404 page.

## CORS

Verify that the Cloudflare Pages frontend can call the Railway backend using:

```text
CLIENT_ORIGIN
```

without using an unrestricted `*` origin.

---

# Secrets and Repository Safety

The following must never be committed:

```text
server/.env
client/.env
DATABASE_URL credentials
JWT_SECRET
production database passwords
```

The repository should commit only example configuration:

```text
server/.env.example
client/.env.example
server/.env.test.example
```

Production environment values belong in Cloudflare and Railway environment-variable configuration.

Public deployment URLs may be documented because they are not secrets.

---

# Local vs Production Configuration

## Local Development

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:3000

CLIENT_ORIGIN:
http://localhost:5173

VITE_API_BASE_URL:
empty

API requests:
Vite development proxy
```

## Production

```text
Frontend:
Cloudflare Pages

Backend:
Railway

Database:
Railway PostgreSQL

CLIENT_ORIGIN:
Cloudflare Pages origin

VITE_API_BASE_URL:
Railway backend origin

API requests:
Browser → Railway directly over HTTPS
```

---

# Future Provider Changes

The application is not tightly coupled to Cloudflare Pages or Railway.

The deployment architecture depends only on:

```text
Static frontend hosting
+
Node.js hosting
+
PostgreSQL
```

A future provider change should normally require configuration changes rather than application architecture changes.

For example:

```text
Frontend provider changes
→ update frontend build/deployment configuration

Backend provider changes
→ configure the same server environment variables

PostgreSQL provider changes
→ update DATABASE_URL
```

The core TindaTrack application architecture remains unchanged.