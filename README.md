# HomeZone Insights (CIS 550)

Web application that integrates **housing (ZHVI-style)**, **Census**, and **public school** data so users can explore affordability, school quality, and neighborhood context at the ZIP level.

## Repository layout

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router pages and API route handlers |
| `app/api/` | HTTP API backed by PostgreSQL queries (with dev mock fallback) |
| `components/` | Shared React UI (navigation, map shell, forms) |
| `db/` | SQL DDL (`schema.sql`) and optional `seed.sql` for local development |
| `lib/` | Shared server utilities (database connection helper) |
| `public/` | Static assets |

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (local or AWS RDS) when you want live data instead of mocks

## Database setup

```bash
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/seed.sql
```

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech stack

- **Frontend:** React, Tailwind CSS, Next.js App Router
- **Backend:** Next.js route handlers (Node)
- **Database:** PostgreSQL (recommended hosting: AWS RDS per course guidance)

## Team
Krishav Singla, Aarav Mulinti, Anika Sundararajan, Natalie Lim.
