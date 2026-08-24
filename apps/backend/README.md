# Backend Foundation

This package contains the IVA backend shell only. The goal is to keep the structure
stable before feature work starts.

## Layout

- `src/config` for environment parsing and runtime constants.
- `src/http` for the framework-agnostic HTTP server and route primitives.
- `src/routes` for system routes and API route grouping.
- `src/modules` for feature shells only. Business logic stays out until the module is explicitly built.
- `src/workers` for worker manifests and future job orchestration.
- `supabase/functions` for edge-function scaffolding and deployment entrypoints.

## Commands

- `npm run build --workspace @iva/backend`
- `npm run type-check --workspace @iva/backend`
- `npm run dev --workspace @iva/backend`

## Boundary rules

- Keep frontend UI code out of this package.
- Keep shared contract changes in `shared/` only.
- Add feature logic module-by-module instead of growing a monolith entrypoint.
