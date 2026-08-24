# Data Ingestion Worker

## Architecture
Ingestion works via backend worker microservices located in `apps/backend/src/workers/ingestion`.
It parses incoming scheme sheets, validates records against schemas defined in `@shared/schemas`, and commits them to the database.
