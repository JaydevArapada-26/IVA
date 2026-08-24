# Database Architecture

## Structure
The database boundary is configured inside `apps/backend/src/db/`:
- `client.ts`: Connection pool initialization.
- `schema/`: Declarative schema definitions (one per domain).
- `migrations/`: Auto-generated migration files.
- `repositories/`: General database query repositories.

## Drizzle ORM
We use Drizzle ORM to build SQL queries.
No raw SQL execution is allowed in controller classes. All queries must be abstracted inside repositories.
