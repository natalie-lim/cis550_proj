# Dependencies

## Runtime

| Package | Version | Purpose |
|---|---|---|
| next | ^15.5.15 | Full-stack React framework (App Router, API routes, SSR) |
| react | ^19.1.0 | UI component library |
| react-dom | ^19.1.0 | React DOM renderer |
| pg | ^8.14.1 | PostgreSQL client for Node.js (connects to AWS RDS) |
| recharts | ^2.15.2 | Chart library used for the housing trend line chart |
| firebase | ^12.13.0 | Firebase client SDK (authentication) |
| firebase-admin | ^13.8.0 | Firebase Admin SDK (server-side auth verification) |

## Development

| Package | Version | Purpose |
|---|---|---|
| typescript | ^5.8.3 | Static type checking |
| tailwindcss | ^3.4.17 | Utility-first CSS framework |
| autoprefixer | ^10.4.21 | PostCSS plugin for CSS vendor prefixes |
| postcss | ^8.5.3 | CSS transformation toolchain |
| eslint | ^9.24.0 | JavaScript/TypeScript linter |
| eslint-config-next | ^15.5.15 | ESLint rules for Next.js projects |
| vitest | ^4.1.5 | Unit test framework |
| @vitest/coverage-v8 | ^4.1.5 | Code coverage via V8 |
| @vitest/coverage-istanbul | ^4.1.5 | Code coverage via Istanbul |
| @testing-library/react | ^16.3.2 | React component testing utilities |
| @testing-library/jest-dom | ^6.9.1 | Custom DOM matchers for tests |
| @testing-library/user-event | ^14.6.1 | User interaction simulation for tests |
| jsdom | ^29.1.1 | DOM environment for testing |
| vite-tsconfig-paths | ^6.1.1 | Resolves TypeScript path aliases in Vitest |
| @types/node | ^22.14.1 | TypeScript types for Node.js |
| @types/pg | ^8.11.13 | TypeScript types for pg |
| @types/react | ^19.1.2 | TypeScript types for React |
| @types/react-dom | ^19.1.2 | TypeScript types for React DOM |

## System Requirements

- **Node.js** 20+
- **Python** 3.11+ (for `db/upload.py` data ingestion script)
- **psycopg2-binary** (`pip install psycopg2-binary`) — Python PostgreSQL driver used by upload script
- **PostgreSQL** 15+ client (`brew install libpq` on Mac) — optional, for running raw SQL against RDS

## Installation

```bash
npm install
```

To run the data upload script:
```bash
pip install psycopg2-binary
DATABASE_URL="postgresql://..." python3.11 db/upload.py
```
