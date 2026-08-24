# Developer Contribution Guide

## Monorepo Standards
1. Use `@shared` package aliases. Never import relatively from `packages/shared`.
2. Do not introduce circular dependencies.
3. Every commit must pass `npm run type-check` and `npm run build`.
