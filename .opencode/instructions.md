# RealEstate CRM — Project Context

## Stack
- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- **Backend**: NestJS 11 (Express) + TypeScript
- **Database**: PostgreSQL 16 (Docker, port 5433)
- **ORM**: Prisma 7.8
- **Auth**: next-auth v5 (frontend), Passport + JWT (API backend)
- **UI**: @base-ui/react (shadcn/ui), Recharts, TanStack React Table
- **Data Fetching**: TanStack React Query
- **State**: Redux (legacy) + React Query
- **API Docs**: Swagger (@nestjs/swagger)
- **Testing**: Jest + Supertest (API unit/integration), Playwright (E2E)

## Layout
```
dashboard/
  apps/
    api/          — NestJS 11 backend (port 4000)
      prisma/     — Prisma schema + migrations
      src/
        modules/  — Feature modules (auth, hrms, crm, ems, inventory)
    web/          — Next.js 16 frontend (port 3000)
      src/
        app/      — App router pages & layouts
        components/ — React components
        hooks/    — Custom hooks (React Query wrappers)
        lib/      — Utilities, auth config
      e2e/        — Playwright tests
  docker-compose.yml — PostgreSQL + API + Web
  opencode.json   — MCP server config
```

## Key Conventions
- Backend controllers check `@Roles(AdminRole.ADMIN)` decorator; always update both controller AND service
- API runs on port 4000, Web on port 3000
- Auth: NextAuth credentials provider calls `POST /api/auth/login` on the backend
- Demo users: admin@company.com / Admin@123, sales@company.com / Sales@12345
- Playwright e2e tests use API-based sign-in (form UI incompatible with React 19 event delegation)
