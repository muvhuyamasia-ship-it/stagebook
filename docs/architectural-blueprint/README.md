# StageBook Architectural Blueprint — Audit Package

Self-contained documentation for external architecture and security audits.

**Generated from:** commit `e6194f4` (main)  
**Date:** July 2026  
**Scope:** `packages/shared`, `apps/stagebook-web`, `apps/mobile`, `apps/api` (cross-reference)

## Contents

| File | Description |
|------|-------------|
| [FULL-BLUEPRINT.md](./FULL-BLUEPRINT.md) | Complete single-document blueprint (all sections) |
| [01-monorepo-and-shared.md](./01-monorepo-and-shared.md) | Topology + `packages/shared` |
| [02-stagebook-web.md](./02-stagebook-web.md) | Web dashboard architecture |
| [03-mobile.md](./03-mobile.md) | Expo mobile app architecture |
| [04-api-backend.md](./04-api-backend.md) | Express API, routes, services |
| [05-flows-security-risks.md](./05-flows-security-risks.md) | E2E flows, security matrix, risk register |

## How to download

**Option A — Zip from terminal:**
```bash
cd "/Users/admin/Documents/Stage app"
zip -r stagebook-architectural-blueprint.zip docs/architectural-blueprint
```

**Option B — Copy folder:**  
Drag `docs/architectural-blueprint` to Desktop or cloud storage.

## Local dev ports (reference)

| Service | Port | Script |
|---------|------|--------|
| API | 4000 | `npm run dev:api` |
| Marketing site | 5173 | `npm run dev:web` |
| Web dashboard | 5174 | `npm run dev:stagebook-web` |
| Mobile Metro | 8081 | `npm run dev:mobile` |

## Demo accounts (seeded on API boot)

| Role | Email | Password |
|------|-------|----------|
| Client | `client@stagebook.test` | `password123` |
| Artist | `artist@stagebook.test` | `password123` |
| Representative | `rep@stagebook.test` | `password123` |