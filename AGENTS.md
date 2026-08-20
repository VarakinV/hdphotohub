# AGENTS.md

## Project
Next.js 15 (App Router) + Prisma 6 + PostgreSQL (Neon). Reels/videos render via two providers: JSON2Video (existing) and Remotion Lambda (new, in `lib/video/remotion-provider.ts`). Remotion compositions live in `remotion/` and are registered in `remotion/Root.tsx`.

## Commands
- Dev server: `npm run dev` (turbopack)
- Typecheck: `npx tsc --noEmit`
- Lint: `npx next lint`
- Production build: `npx next build`
- Remotion Studio: `npx remotion studio --no-open --port 3001`
- Render a still for visual verification: `npx remotion still ReelV1 out/frame.png --frame=240`

## Database migrations (Neon + PgBouncer advisory-lock issue)
`prisma migrate dev`/`migrate resolve` hang with `P1002` "Timed out trying to acquire a postgres advisory lock" because `DATABASE_URL` points at Neon's pooled (`-pooler`) endpoint, which does not support `pg_advisory_lock`. The schema uses `directUrl = env("DIRECT_URL")` (non-pooled host, already in `.env`). Workaround if migrate still fails:
1. Apply the migration SQL manually without locking:
   `npx prisma db execute --schema prisma\schema.prisma --file prisma\migrations\<dir>\migration.sql` (wrap in BEGIN/COMMIT).
2. Record it in the history table (via a one-off script inserting into `_prisma_migrations` with `migration_name` and md5 `checksum` of the SQL file).
Verify with `npx prisma migrate status` / `prisma generate` after.

## Remotion notes
- Import Lambda client APIs from `@remotion/lambda/client`, NOT `@remotion/lambda` (the top-level index bundles `@remotion/cli` + `@remotion/renderer` and fails the Next.js production build).
- `VideoTemplate` registry drives which variants render: only `status = 'active'` rows are enqueued by `generate-remotion`. Seed via `node prisma/seed-remotion.cjs`.
- Templates are previewed at `/admin/templates` with `@remotion/player`; composition imports must stay behind `next/dynamic({ ssr: false })` because `@remotion/google-fonts` needs a browser.
- Rendering requires Lambda infra in `ca-central-1`: env vars `REMOTION_FUNCTION_NAME`, `REMOTION_SERVE_URL`, `REMOTION_BUCKET_NAME`, `REMOTION_AWS_ACCESS_KEY_ID`, `REMOTION_AWS_SECRET_ACCESS_KEY`, `REMOTION_AWS_REGION`, `REMOTION_WEBHOOK_URL`, `REMOTION_WEBHOOK_TOKEN`.
