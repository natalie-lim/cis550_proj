import { Pool, type QueryResult, type QueryResultRow } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool | null {
  const url: string | undefined = process.env.DATABASE_URL;
  if (!url) {
    return null;
  }
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

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
