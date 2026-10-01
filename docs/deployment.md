# TindaTrack Deployment Guide

This document describes the production deployment requirements for TindaTrack.

It intentionally stays provider-agnostic. Provider-specific configuration should only be added after a frontend host, backend host, and managed PostgreSQL provider have been selected.

## Deployment Topology

TindaTrack uses a simple three-part production topology:

```text
Frontend
→ Static Vite deployment

Backend
→ Node.js / Express service

Database
→ Managed PostgreSQL
```

The application is intentionally deployed as a modular monolith.

No Kubernetes, microservices, or container orchestration are required for the current project scope.

---

## Frontend Deployment

The frontend is located in:

```text
client/
```

### Build Command

From the repository root:

```bash
npm run build --workspace client
```

or through the root workspace script:

```bash
npm run build
```

The root build command also builds the backend.

### Build Output

The Vite production build is generated in:

```text
client/dist
```

The selected frontend hosting provider should publish this directory as a static site.

### Production Environment Variable

The frontend requires:

```text
VITE_API_BASE_URL
```

Example:

```env
VITE_API_BASE_URL="https://api.example.com"
```

This value should point to the deployed Express backend.

`VITE_API_BASE_URL` is a public frontend configuration value and is embedded into the Vite production build.

Secrets such as `JWT_SECRET`, database credentials, or passwords must never be stored in `VITE_*` variables.

---

## React Router SPA Fallback

TindaTrack uses React Router with `BrowserRouter`.

Because of this, the frontend hosting provider must support Single Page Application fallback behavior.

Direct browser requests to application routes must return:

```text
/index.html
```

instead of a hosting-provider 404 page.

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

For example:

```text
Browser requests:

GET /reports

        ↓

Static frontend host receives /reports

        ↓

Host rewrites the request to:

/index.html

        ↓

React loads

        ↓

React Router resolves /reports

        ↓

Daily Sales page renders
```

Without this fallback, navigation from inside the running application may work while refreshing or directly opening `/reports`, `/inventory`, `/sales/new`, and other client-side routes results in:

```text
404 Not Found
```

### Required Hosting Behavior

Conceptually, the frontend host needs a rewrite similar to:

```text
/* → /index.html
```

The exact configuration depends on the selected provider.

Provider-specific files such as:

```text
vercel.json
netlify.toml
```

should only be introduced after a deployment platform has been selected.

---

## Backend Deployment

The backend is located in:

```text
server/
```

### Build Command

From the repository root:

```bash
npm run build --workspace server
```

### Production Start Command

```bash
npm run start --workspace server
```

The root workspace also exposes:

```bash
npm run start
```

which starts the server workspace.

### Required Environment Variables

The Express service uses the following production configuration:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
CLIENT_ORIGIN="https://frontend.example.com"
PORT=3000
NODE_ENV="production"
```

The hosting provider may supply `PORT` automatically.

`CLIENT_ORIGIN` must match the deployed frontend origin so that browser requests are allowed by the API's CORS policy.

Example:

```env
CLIENT_ORIGIN="https://tindatrack.example.com"
```

Do not use `"*"` as the production CORS origin.

---

## PostgreSQL

Production should use a managed PostgreSQL database.

The backend receives the connection string through:

```text
DATABASE_URL
```

Example format:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
```

The actual production connection string must be stored in the backend hosting provider's environment configuration.

It must never be committed to the repository.

---

## Prisma Production Migrations

Production schema changes must use committed Prisma migrations.

Run:

```bash
npm run db:migrate:deploy
```

This ultimately executes:

```bash
prisma migrate deploy
```

against the configured production `DATABASE_URL`.

Production deployment must not use:

```bash
prisma migrate dev
```

`prisma migrate dev` remains a development-only workflow for creating and validating migrations.

The production migration flow is:

```text
Committed Prisma migrations
        ↓
Production DATABASE_URL
        ↓
prisma migrate deploy
        ↓
Application start
```

---

## Health Check

The backend exposes:

```text
GET /health
```

A healthy server returns:

```json
{
  "status": "ok"
}
```

The endpoint is intended for deployment monitoring and service health checks.

It must not expose:

- database credentials
- environment variables
- JWT secrets
- user information
- internal infrastructure details

A hosting provider may use `/health` as the backend service health-check path.

---

## Authentication Assumptions

TindaTrack currently uses bearer-token authentication.

The flow is:

```text
Login
        ↓
Server returns JWT
        ↓
Frontend stores authentication session
        ↓
Frontend sends:

Authorization: Bearer <token>
```

The application does not currently use authentication cookies.

Because of this:

- cross-origin requests do not require `credentials: "include"`
- CORS does not need credentialed-cookie support
- SameSite cookie configuration is not required
- the deployed frontend and API should both use HTTPS

The production `JWT_SECRET` must be a strong value and must not reuse a development secret.

---

## Production Configuration Summary

### Frontend

```text
Build:
npm run build --workspace client

Output:
client/dist

Environment:
VITE_API_BASE_URL=https://<backend-host>

Hosting requirement:
SPA rewrite/fallback to /index.html
```

### Backend

```text
Build:
npm run build --workspace server

Start:
npm run start --workspace server

Environment:
DATABASE_URL
JWT_SECRET
CLIENT_ORIGIN
PORT
NODE_ENV
```

### Database

```text
Managed PostgreSQL

Migration command:
npm run db:migrate:deploy
```

---

## Deployment Sequence

A typical production deployment should follow this order:

```text
1. Provision managed PostgreSQL

2. Configure backend environment variables

3. Build backend

4. Run committed Prisma migrations

5. Start backend

6. Verify GET /health

7. Obtain deployed backend URL

8. Configure frontend VITE_API_BASE_URL

9. Build frontend

10. Deploy client/dist

11. Configure SPA fallback to /index.html

12. Configure backend CLIENT_ORIGIN
    with the deployed frontend origin

13. Verify authentication and API requests

14. Verify direct frontend routes such as:
    /inventory
    /reports
    /sales/new
```

---

## Production Verification Checklist

Before considering a deployment complete, verify:

- Backend starts successfully with production environment validation.
- `/health` returns HTTP 200.
- The backend connects to the managed PostgreSQL database.
- `prisma migrate deploy` completes successfully.
- The frontend uses the deployed API URL.
- CORS accepts the deployed frontend origin.
- Login works over HTTPS.
- Authenticated API calls send the bearer token correctly.
- `/inventory` works through normal navigation.
- Directly opening `/inventory` works.
- Refreshing `/inventory` works.
- Directly opening `/reports` works.
- Directly opening `/sales/new` works.
- Unknown API routes still return the API's JSON 404 response.
- No secrets are present in the frontend bundle or committed environment files.

---

## Provider-Specific Configuration

TindaTrack currently does not commit provider-specific deployment configuration.

Files such as:

```text
vercel.json
netlify.toml
render.yaml
```

should be added only after a deployment provider has been selected.

At that point, the provider configuration should implement the requirements documented here rather than changing the application architecture.