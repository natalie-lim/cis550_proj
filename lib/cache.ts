// In-memory TTL cache for expensive insight queries.
// Next.js route handlers share the module instance across requests within one process,
// so entries persist for the server lifetime (cleared on restart).

type Entry<T> = { data: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();

/** Returns cached value if still within TTL, otherwise null. */
export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

/** Stores a value with a TTL (default 5 minutes). */
export function setCached<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}
