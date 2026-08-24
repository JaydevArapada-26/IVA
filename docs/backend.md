# Backend Layer Architecture

## Feature-Oriented Modules
The backend follows a strict modular structure. Each feature lives in its own subdirectory inside `apps/backend/src/modules/` containing:
- `controller.ts`: Handles requests and response mappings.
- `service.ts`: Handles core business logic.
- `repository.ts`: Handles database queries.
- `routes.ts`: Lists internal route configurations.
- `schema.ts`: Request validations.
- `dto.ts`: Data Transfer Objects.
- `mapper.ts`: Maps DTOs to entities.
- `types.ts`: Local type annotations.
- `index.ts`: Exposes module entry points.
