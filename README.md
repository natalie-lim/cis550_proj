# HomeZone Insights (CIS 550)

Web application that integrates **housing (ZHVI-style)**, **Census**, and **public school** data so users can explore affordability, school quality, and neighborhood context at the ZIP level.

This repository is organized for CIS 550 milestones: a **PostgreSQL** database (schema and seed data under `db/`), **Next.js** API routes under `app/api/`, and distinct UI pages under `app/` for map exploration, ZIP detail, comparison, curated SQL-driven insights, and methodology.

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

## Configuration

Copy `.env.example` to `.env.local` and set:

- `DATABASE_URL` — PostgreSQL connection string (optional for UI-only dev; APIs return sample JSON when unset)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — optional; enables the embedded map on the home page

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

## Team (Milestone 1)

Krishav Singla, Aarav Mulinti, Anika Sundararajan, Natalie Lim.

## Disclosure

Scaffolding and UI wiring were assisted by generative AI tools; the team remains responsible for data ingestion, query optimization, and final report accuracy per course policy.
