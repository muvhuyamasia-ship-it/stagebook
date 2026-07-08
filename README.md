# Rasilwela Group Platform

Responsive website and admin/client portal for Rasilwela Group, built as a monorepo.

## Workspaces

- `apps/api`: Express + TypeScript API for auth, editable site content, contact threads, and admin replies
- `apps/web`: React + Vite website with public pages, login/signup, forgot password, client inbox, and admin dashboard
- `apps/mobile`: Existing Expo app scaffold kept in the workspace
- `packages/shared`: shared types used by the API and workspace apps

## Product scope

- Public homepage and about page for Rasilwela Group
- Software division highlighted as the active subsidiary
- Transport and Security shown as in development
- Company email hosting and business analysis promoted as core services
- Admin-managed homepage content without code edits
- Contact-us inquiries stored in an admin inbox
- Admin replies through email-style delivery or in-app chat
- Login, sign up, forgot password, reset password, client dashboard, and admin dashboard

## Demo accounts

- Admin: `admin@rasilwela.test` / `Password123!`
- Client: `client@rasilwela.test` / `Password123!`

## Scripts

From the repo root:

- `npm run dev:api`
- `npm run dev:web`
- `npm run test`
- `npm run test:web`
- `npm run build:web`

## Notes

- The current API uses an in-memory store for demo/development workflows.
- Passwords are hashed and reset tokens are issued through the API.
- Public content is fetched from `/api/site/content` and can be edited from the admin dashboard.
