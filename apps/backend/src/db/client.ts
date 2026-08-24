import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export interface DatabaseClientConfig {
  readonly connectionString: string;
  readonly ssl?: boolean;
}

export function createDatabasePool(config: DatabaseClientConfig): Pool {
  const pool = new Pool({
    connectionString: config.connectionString,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });

  // Catch idle client connection drops (e.g. Supabase pooler connection recycling / ECONNRESET)
  // so they don't cause unhandled process crashes.
  pool.on('error', (err) => {
    console.warn('[db/pool] Idle client pool error (auto-recovering):', err.message);
  });

  return pool;
}

export function createDatabaseClient(config: DatabaseClientConfig) {
  const pool = createDatabasePool(config);
  const db = drizzle(pool, { schema });

  return {
    pool,
    db,
  };
}
