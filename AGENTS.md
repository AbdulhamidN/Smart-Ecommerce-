# Project Rules — Smart E-Commerce (Project 2)

## Stack
- Frontend: React 18 + Vite + Tailwind + React Router + TanStack Query
- Backend: Node 20 + Express + zod
- ORM: Prisma (MySQL). Provider = "mysql". previewFeatures = ["fullTextSearch", "fullTextIndex"]
- Auth: JWT access 15m + refresh 7d, bcrypt, httpOnly cookies
- Money: ALWAYS Int cents. Never floats.
- Tests: Vitest + Supertest in apps/api/tests/

## Conventions
- API base: /api/v1
- Error shape: { error: { code, message, details? } }
- Every route validates with zod.
- Every protected route uses authenticate + requireRole.

## Verification
- API: cd apps/api && npm test
- Web: cd apps/web && npm run build
