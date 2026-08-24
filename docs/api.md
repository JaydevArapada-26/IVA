# API Design and Contracts

## Routing Structure
Routes are configured inside `apps/backend/src/routes/`:
- `api/v1/`: Version 1 API routes (`auth`, `profile`, `schemes`, `admin`, `assistant`).
- `system/`: Operational routes (`health`, `ready`).

## Response Schema
All response objects follow the standard contract defined in `@shared/contracts/api.ts`.
Controllers must encapsulate responses cleanly.
