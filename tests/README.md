Test scaffolding

This repo does not yet include a configured test runner. Recommended setup: Vitest.

Install dev deps (ask/confirm before running):
- pnpm add -D vitest @vitest/ui @types/node

Suggested scripts (package.json):
- "test": "vitest"
- "test:run": "vitest run"

Included samples:
- tests/invite.test.ts — unit tests for invitation token utils

Integration tests to add (suggested):
- tests/invitations.api.test.ts — exercise POST /api/invitations and POST /api/invitations/[token]/accept with a test DB
- tests/auth.session.test.ts — ensure realtorId/role appear in session and access control works for /portal and /admin

E2E tests (Playwright) — optional:
- Accept invite flow: admin issues invite → realtor sets password → lands on /portal and sees their orders

