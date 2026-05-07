// PostgreSQL connection pool using the `pg` library.
// DATABASE_URL is read from the environment; when unset (local dev without .env.local)
// getPool() returns null and queryRows() returns an empty array so API routes fall
// back to mock data automatically.
//
// SSL is required for AWS RDS — without rejectUnauthorized:false the connection is
// refused with "no pg_hba.conf entry ... no encryption".

import { Pool, type QueryResult, type QueryResultRow } from "pg";

let pool: Pool | null = null;

/** Returns the shared connection pool, or null if DATABASE_URL is not set. */
export function getPool(): Pool | null {
  const url: string | undefined = process.env.DATABASE_URL;
  if (!url) {
    return null;
  }
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

/** Runs a parameterized query and returns typed rows. Returns [] on any error. */
export async function queryRows<T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const p: Pool | null = getPool();
  if (!p) {
    return [];
  }
  try {
    const result: QueryResult<T> = await p.query<T>(text, params);
    return result.rows;
  } catch {
    return [];
  }
}
