# IVA Workspace Structure

```
iva-workspace/
├── apps/
│   ├── web/                # React Native Web / React web application
│   │   ├── src/
│   │   │   ├── pages/      # Web portal pages
│   │   │   └── App.tsx     # Web router & layout
│   │   └── package.json
│   ├── admin/              # React Admin Panel
│   │   ├── src/
│   │   │   ├── pages/      # 10 Admin management routes
│   │   │   └── App.tsx     # Admin sidebar layout & auth
│   │   └── package.json
│   └── backend/            # IVA backend foundation
│       ├── src/
│       │   ├── config/     # Env parsing and runtime constants
│       │   ├── http/       # Server adapter, router, and response helpers
│       │   ├── modules/    # Feature shells only, no business logic yet
│       │   ├── routes/     # System routes and API route catalog
│       │   ├── workers/    # Ingestion worker scaffolding
│       │   └── main.ts     # Backend entrypoint
│       ├── supabase/
│       │   └── functions/  # Supabase function scaffolding
│       └── package.json
├── shared/                 # Shared logic & tokens across apps
│   ├── types/              # Existing frontend domain types
│   ├── contracts/          # Backend-safe transport and orchestration contracts
│   ├── schemas/            # Runtime validation and schema descriptors
│   ├── constants/          # Themes, color palettes, API, and module constants
│   ├── utils/              # Shared helpers and guards
│   └── i18n/               # Multi-language translations dictionary
├── docs/                   # Documentation and specs
├── scripts/                # Development & build scripts
├── config/                 # Tooling configurations
└── package.json            # Root monorepo workspace configuration
```

## Architectural Rules
1. UI/app-specific code stays strictly inside its own app folder (`apps/web`, `apps/admin`).
2. Backend code stays inside `apps/backend`, including worker and Supabase scaffolding.
3. Anything needed across multiple surfaces (types, contracts, schemas, constants, validators, i18n) goes in `shared/`.
4. Strict adherence to light and dark theme palettes defined in Section 6.
5. WCAG AA contrast compliance and maximum 2-tap primary navigation depth.
