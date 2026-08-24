import { loadBackendEnv } from '../config/env';
import { createDatabaseClient } from './client';

// Centralized db instance for production-grade dependency injection / repositories.
// Lives in its own module (not db/index.ts) so that db/repositories/*.ts can import `db`
// without creating a require cycle through db/index.ts <-> db/repositories/index.ts.

const env = loadBackendEnv();
const connectionString = env.databaseUrl;

// Supabase (and most managed Postgres) requires TLS on its pooler/direct endpoints; only
// skip it for local dev databases where no cert is served.
const isLocalDatabase = /(localhost|127\.0\.0\.1)/.test(connectionString);

export const { db, pool } = createDatabaseClient({
  connectionString,
  ssl: !isLocalDatabase,
});
