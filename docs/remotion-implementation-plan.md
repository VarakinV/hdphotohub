# Remotion Reels & Slideshows — Implementation Plan

> **Status:** ACTIVE — Phases 0–5 complete. Lambda deployed. All 11 templates built and visually reviewed; ready for DRAFT→ACTIVE approval.  
> **Date:** 2026-08-11 (v3 — Phase 3 complete)  
> **Goal:** Add Remotion as a second video rendering provider alongside the existing JSON2Video integration, without removing JSON2Video.

### v3 Progress Snapshot
- ✅ ReelV1 renders end-to-end: generate → Lambda render → S3 → delivery page playback.
- ✅ Lambda function + site deployed in `ca-central-1`; env wired; webhook (HMAC + token) working.
- ✅ Music: per-template default + batch override at generate + per-reel override in the list.
- ✅ Deletions purge AWS S3 + Remotion bucket + DB.
- ✅ Delivery-page video playback fixed (CORS control-bar issue).
- ✅ Phase 3: ReelV2–V9 + SlideshowH1/H2 built, still frames reviewed, no visual blockers.

---

## 1. Current Architecture Summary

| Layer | What exists today |
|---|---|
| **Provider interface** | `lib/video/provider-interface.ts` — `VideoProvider` interface with `render()`, `getStatus()`, `parseWebhook()` |
| **J2V provider** | `lib/video/j2v-provider.ts` — calls JSON2Video v2 API, posts template + merge variables |
| **Shotstack provider** | `lib/video/shotstack-provider.ts` — legacy, hidden in UI |
| **Generate route** | `app/api/orders/[id]/reels/generate-j2v/route.ts` — creates 11 `OrderReel` rows (9V + 2H), calls J2V API |
| **Webhook** | `app/api/integrations/json2video/webhook/route.ts` — receives completion, copies MP4 to S3, generates poster via FFmpeg |
| **DB** | `OrderReel` model with `provider` column (`'j2v'` / `'shotstack'`), `renderId`, `status`, `url`, `thumbnail` |
| **UI** | `ReelsList` component polls status, shows variant label, storage badge, actions (retry/cancel/delete/sync) |
| **Templates** | Stored in JSON2Video platform, referenced by env-var IDs (`JSON2VIDEO_TEMPLATE_ID_V1..V9`, `_H1`, `_H2`) |
| **Merge variables** | `ADDRESS`, `CITY`, `POSTCODE`, `BEDROOMS`, `BATHROOMS`, `SQFT`, `IMAGE_1..6`, `AGENT_PICTURE`, `AGENT_NAME`, `AGENT_PHONE`, `AGENCY_LOGO` |
| **Music** | **None** — button label says "Generate 3 reels (no music)". Audio is baked into J2V templates. |
| **Storage** | S3 bucket `photos4remedia` in `ca-central-1` |
| **Deployment** | Vercel (serverless). FFmpeg disabled on Vercel. |

---

## 2. Architecture Decision: Where Remotion Renders

Remotion **cannot** render on Vercel serverless functions (no Chromium, 10s/60s timeout limits, no FFmpeg). Options:

| Option | Pros | Cons |
|---|---|---|
| **A. Remotion Lambda (recommended)** | Serverless, scales to 0, same AWS account as S3, `ca-central-1` supported, no always-on server, ~$0.01-0.05 per render | Requires Lambda deployment via CLI, AWS CloudFormation stack |
| B. Self-hosted render server | Full control, cheaper at very high volume | Needs always-on EC2/ECS, ops burden, auto-scaling config |
| C. Render on user's local machine | No infra | Not viable for production |

**Decision: Option A — Remotion Lambda in `ca-central-1`** (confirmed by you; same region as your S3 bucket, same AWS account).

---

## 3. Remotion License — Good News

**Your company has 2 people → you qualify for the Remotion Free License. No subscription needed — not during development, not at production.**

Per Remotion's license terms:
> You are eligible to use Remotion for free if you are: ... a for-profit organisation with **up to 3 employees** ...

The paid options only apply once you cross the 3-person threshold:

| License | When it applies | Cost |
|---|---|---|
| **Free License** | Individual, or for-profit org with **≤3 employees** (your case) | $0 |
| Remotion for Automators | 4+ people, automated pipelines | $0.01/render, $100/mo minimum |
| Remotion for Creators | 4+ people, manual low-volume | $25/seat/mo |

**Implication:** you can build, deploy, and run the whole Remotion pipeline in production for $0 in licensing. The $100/month only kicks in if/when you grow beyond 3 employees. No upfront purchase, no proration concern. (You can create a free remotion.pro account later only if you exceed 3 people.)

---

## 4. Template Design Direction

**Confirmed:** fresh visual style is fine — but must look professional with modern transitions and animations, built using Remotion's official AI skills as best-practice guidance.

### Remotion Agent Skills

The Remotion team publishes Agent Skills (`remotion-dev/skills`) — best-practice guides that the AI agent loads when building templates. These will be installed into the project so I can follow them:

```bash
npx remotion skills add        # installs to .agents/skills/
```

Then symlink/copy into `.kilo/skills/` so the Kilo AI agent can load them. Available skills:

| Skill | Purpose |
|---|---|
| `/remotion-best-practices` | Umbrella skill — use when unsure |
| `/remotion-create` | Create a new composition/project |
| `/remotion-markup` | Best practices for markup: animations, layout, typography, media, audio, timing |
| `/remotion-studio` | Launch Studio to preview |
| `/remotion-render` | Render to video/still |
| `/remotion-transitions` | Modern transitions between scenes |
| `/remotion-interactivity` | Make elements editable in Studio |
| `/remotion-docs` | Look up API references before implementing |
| `/remotion-upgrade` | Keep packages + skills updated |
| `/remotion-saas` | Architecture guidance for product integrations |
| `/remotion-maps`, `/remotion-captions`, `/remotion-multimedia` | Optional, as needed |

These give me (the AI agent) the exact same best-practice knowledge the Remotion team publishes, so templates will follow idiomatic patterns (e.g., `@remotion/transitions` for scene changes, `@remotion/google-fonts` for typography, proper `sequence`/`interpolate` usage, audio fade in/out).

### Design principles for the 11 templates

- **Ken Burns** (slow zoom/pan) on property images via `@remotion/transitions` + `interpolate`
- **Modern transitions**: slide, fade, wipe, flip, spring-based
- **Bold typography** with Google Fonts (e.g., Playfair Display + Inter)
- **Brand consistency**: brokerage logo, realtor headshot card, phone CTA
- **Motion design**: entrance animations, stat counters (beds/baths/sqft), parallax layers
- **15–20s duration** at 30fps, matching J2V output feel
- Music with fade-in/out via `@remotion/media-utils` + `<Audio>`

---

## 5. Repository Structure

Remotion will be **integrated into the existing Next.js app** (not a separate monorepo package). This keeps a single `package.json`, shared types, and enables `@remotion/player` for live preview inside the Next.js app.

```
hdphotohub-clone/
├── app/                          # Next.js app (unchanged)
├── components/                   # React components (unchanged)
├── lib/video/
│   ├── provider-interface.ts     # (existing, extend ShotVariant)
│   ├── j2v-provider.ts           # (existing, unchanged)
│   ├── remotion-provider.ts      # NEW — Remotion Lambda provider
│   └── poster.ts                 # (existing)
├── remotion/                     # NEW — Remotion project root
│   ├── Root.tsx                  # Composition registry
│   ├── remotion.config.ts
│   ├── compositions/
│   │   ├── shared/               # PropertyCard, RealtorCard, ImageSlide, TransitionSlide, MusicOverlay, BrandBar
│   │   ├── reels/                # ReelV1.tsx ... ReelV9.tsx
│   │   └── slideshows/           # SlideshowH1.tsx, SlideshowH2.tsx
│   ├── lib/
│   │   ├── types.ts              # Zod schemas for composition props
│   │   └── fonts.ts              # Google Fonts registration
│   └── audio/                    # Royalty-free music (10-20s tracks)
├── .agents/skills/               # Remotion agent skills (installed)
├── .kilo/skills/remotion/        # Symlink so Kilo agent loads them
├── app/api/orders/[id]/reels/
│   ├── generate-j2v/route.ts     # (existing, unchanged)
│   └── generate-remotion/route.ts # NEW
├── app/api/integrations/
│   ├── json2video/webhook/       # (existing, unchanged)
│   └── remotion/route.ts         # NEW — Lambda render completion webhook
├── app/api/admin/templates/      # NEW — template registry CRUD + status
├── app/api/admin/music/          # NEW — music track CRUD
└── components/orders/
    ├── generate-reels-j2v-button.tsx     # (existing, unchanged)
    ├── generate-reels-remotion-button.tsx # NEW
    ├── remotion-music-picker.tsx          # NEW — dropdown with pre-listen
    └── reels-list.tsx                     # UPDATED — provider badge, music column
```

---

## 6. Packages to Install

### Core Remotion (required)

| Package | Purpose |
|---|---|
| `remotion` | Core library |
| `@remotion/cli` | Studio + CLI for local development and rendering |
| `@remotion/player` | In-browser `<Player>` component for live preview in the admin UI |
| `@remotion/lambda` | Serverless rendering on AWS Lambda |
| `@remotion/zod-types` | Zod schemas for composition props (Studio props editor) |
| `@remotion/transitions` | Modern scene transitions (slide, fade, wipe, flip, spring) |
| `@remotion/google-fonts` | Google Fonts (Playfair Display, Inter, etc.) |
| `@remotion/media-utils` | Audio duration detection, `<Audio>` helpers |
| `@remotion/shapes` | Decorative SVG shapes |
| `@remotion/paths` | SVG path animation utilities |
| `@remotion/tailwind-v4` | Tailwind v4 support inside compositions (you're on Tailwind v4) |

### Already installed (no action needed)

`zod` ^4.0.17, `sharp`, `ffmpeg-static` + `fluent-ffmpeg` (posters), `@aws-sdk/client-s3`, `framer-motion` (usable in compositions).

### Optional / later

`@remotion/lottie`, `@remotion/three`, `@remotion/skia`, `@remotion/noice` — only if a template needs them.

### FFmpeg

Already present via `ffmpeg-static` + `fluent-ffmpeg` for poster extraction. Remotion Lambda bundles its own FFmpeg for encoding — no additional setup.

---

## 7. Database Changes

All changes are **additive** — J2V reels keep working unchanged.

```prisma
// NEW: Music tracks library (your royalty-free tracks, 10-20s)
model VideoMusicTrack {
  id        String   @id @default(cuid())
  name      String
  fileUrl   String
  duration  Float                       // seconds
  genre     String?
  mood      String?                     // "upbeat" | "elegant" | "calm" ...
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  reels     OrderReel[]
  templates VideoTemplate[]             // default track per template
}

// UPDATED: OrderReel — add music selection (baked in at render time)
model OrderReel {
  // ...existing fields unchanged (provider is already a free String)...
  musicTrackId String?
  musicTrack   VideoMusicTrack? @relation(fields: [musicTrackId], references: [id])
}

// NEW: Template registry — drives the draft → preview → production workflow
model VideoTemplate {
  id            String   @id @default(cuid())
  variantKey    String   @unique          // v1-9x16, v2-9x16 ... h1-16x9, h2-16x9
  provider      String   @default('remotion')
  status        String   @default('draft') // draft | active
  name          String                    // "Vertical Reel 1 - Just Listed"
  description   String?
  width         Int
  height        Int
  fps           Float    @default(30)
  durationInFrames Int
  compositionId String                    // e.g. "ReelV1"
  schemaJson    Json?                     // Zod schema snapshot (for preview editor)
  defaultMusicTrackId String?
  defaultMusicTrack VideoMusicTrack? @relation(fields: [defaultMusicTrackId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**Migration:** 1 additive migration creating `VideoMusicTrack`, `VideoTemplate`, and the `musicTrackId` column on `OrderReel`. Nothing dropped, nothing reordered.

---

## 8. Remotion Provider Implementation

### `lib/video/remotion-provider.ts`

```typescript
// Implements VideoProvider interface
// render() → @remotion/lambda renderMediaOnLambda()
//   - compositionId (e.g. 'ReelV1')
//   - inputProps: { images, property, realtor, musicTrackUrl, variantKey }
//   - codec: 'h264'
//   - outName: { bucket, key } → direct upload to S3
// getStatus() → @remotion/lambda getRenderProgress()
// parseWebhook() → Lambda SQS/SNS notification
```

### `app/api/orders/[id]/reels/generate-remotion/route.ts`

- Mirrors `generate-j2v/route.ts` validation (≥3 images, headshot, logo, name, phone, beds, baths, address)
- Only enqueues variants whose `VideoTemplate.status === 'active'`
- Accepts per-reel music selection (`musicTrackId` per variant) from the UI
- Creates `OrderReel` rows with `provider: 'remotion'` + `musicTrackId`
- Calls `RemotionProvider.render()` for each variant

### `app/api/integrations/remotion/route.ts`

- Receives Lambda render completion (SQS-triggered or direct POST)
- Verifies `REMOTION_WEBHOOK_TOKEN`
- Copies final MP4 to S3 (or it's already there via `outName`)
- Generates poster thumbnail (FFmpeg, local only — same as J2V path)
- Updates `OrderReel` status/url/thumbnail
- Chains the queue: each completion starts the next QUEUED render

### Render Queue (`lib/video/remotion-queue.ts`) — reliability for many reels

The generate route used to call `renderMediaOnLambda` for **all 11 variants at once** (`Promise.all`).
`renderMediaOnLambda` blocks until the Lambda *start* routine runs, so when function concurrency
was saturated the calls stalled, the HTTP request timed out, and rows stayed QUEUED forever.

Now all rendering goes through a small serverless-friendly queue:

1. `generate-remotion` only **creates the OrderReel rows (QUEUED)** and returns. No Lambda call per variant.
2. `startRemotionBatch()` claims up to `REMOTION_QUEUE_CONCURRENCY` (default 3) QUEUED rows,
   **oldest first**, atomically (`QUEUED → RENDERING` via a status-filtered `updateMany`, so
   concurrent runners never double-start a render), then starts each via `renderMediaOnLambda`
   and saves the `renderId`.
3. **Webhook chaining** — every completion (success *or* failure) starts the next queued reel
   (`limit: 1`), so a batch of 11 drains itself without a scheduler.
4. **Sync route kick** — the order page's polled sync route also calls `startRemotionBatch(limit: 1)`
   as a safety net, and stale claims (`RENDERING` + `renderId='pending'` older than 2 min) are
   re-queued so a crashed request can't wedge the queue.
5. Failure of one reel never aborts the batch — it's marked FAILED with the real Lambda error
   message and the next reel starts.

Other fixes in this pass:
- **Property stats are strings** so real-estate formats like `"2+1"`, `"2.5"`, and
  `"1,530"` survive unchanged. A shared `formatStat()` helper in
  `remotion/lib/format.ts` adds thousands separators for pure numeric sqft values
  (e.g. DB `1530` renders as `"1,530"`) while leaving `"2+1"`/`"2.5"` untouched.
- **Cap bug**: the 15-reel cap counted *all* reels (including J2V), silently
  truncating the variant list (e.g. only 4 of 11 created). It now counts Remotion
  reels only, skips variants that already exist, and fails loudly if there are too
  many.
- **ReelV1 "Coming Soon" polish**:
  - Address line 1 now shows only the street (extracted from Google-formatted
    address: first comma-separated segment), and line 2 shows city only.
  - UI labels renamed from "Just Listed" to "Coming Soon" on order, delivery,
    and free-reel preview cards.
  - Faded white-waves background fixed by replacing the low-contrast S3 image
    with a curves-enhanced version bundled in `public/remotion/white-waves-bg.jpg`
    and referenced via `staticFile()`. No CSS filters or CRF tweaks are used, so
    text and other elements stay crisp.
  - Long agent names wrap within the space left of the circular headshot instead
    of sliding behind it; the phone number pushes down accordingly.
- **Error surfacing**: failed renders now store the actual Lambda error (not just
  "Render failed"), and the generate button shows the error message.

---

## 9. Composition Templates

Each composition receives a standardized Zod-validated props object (mirrors the J2V merge contract exactly):

```typescript
// remotion/lib/types.ts
import { z } from 'zod';

export const realtorSchema = z.object({
  name: z.string(),
  phone: z.string(),
  headshotUrl: z.string().url(),
  logoUrl: z.string().url(),
});

export const propertySchema = z.object({
  address: z.string(),
  city: z.string(),
  postalCode: z.string(),
  province: z.string().optional(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  sqft: z.number().optional(),
});

export const reelPropsSchema = z.object({
  images: z.array(z.string().url()).min(3).max(6),
  property: propertySchema,
  realtor: realtorSchema,
  musicTrackUrl: z.string().url().optional(),
  variantKey: z.string(),
});

export type ReelProps = z.infer<typeof reelPropsSchema>;
```

### Variant registry (11 total, matching J2V)

| Composition | Variant Key | Dims | Theme (fresh visual style) |
|---|---|---|---|
| `ReelV1` | `v1-9x16` | 1080×1920 | Just Listed — hero + stat counters |
| `ReelV2` | `v2-9x16` | 1080×1920 | For Sale — cinematic Ken Burns slideshow |
| `ReelV3` | `v3-9x16` | 1080×1920 | For Sale — parallax + wipe transitions |
| `ReelV4` | `v4-9x16` | 1080×1920 | Just Listed — bold editorial typography |
| `ReelV5` | `v5-9x16` | 1080×1920 | For Sale — minimal modern |
| `ReelV6` | `v6-9x16` | 1080×1920 | New On The Market — energetic |
| `ReelV7` | `v7-9x16` | 1080×1920 | Seasonal 1 — warm tone, soft transitions |
| `ReelV8` | `v8-9x16` | 1080×1920 | Seasonal 2 — fresh/spring |
| `ReelV9` | `v9-9x16` | 1080×1920 | Seasonal 3 — cozy/autumn |
| `SlideshowH1` | `h1-16x9` | 1920×1080 | Horizontal slideshow — classic, slow crossfades |
| `SlideshowH2` | `h2-16x9` | 1920×1080 | Horizontal slideshow — modern, split-screen |

### Shared components

- `PropertyCard` — address + beds/baths/sqft overlay
- `RealtorCard` — headshot, name, phone CTA
- `ImageSlide` — Ken Burns (slow zoom/pan via `interpolate`)
- `TransitionSlide` — `@remotion/transitions` scene changes
- `MusicOverlay` — `<Audio>` + fade in/out
- `BrandBar` — brokerage logo strip

---

## 10. Music — Defaults + Overrides (implemented as built)

Your tracks are royalty-free, 10–20s long. You want a **default track per template** (so bulk-generating 20–40 reels doesn't require picking music one-by-one), plus the ability to override a single reel's music. This is the flow that is now live:

### Flow
1. **Music library** — admin adds tracks in `/admin/templates` (name, URL, duration, genre, mood) → `VideoMusicTrack` records. Inline `<audio>` pre-listen.
2. **Default per template** — each `VideoTemplate` card in `/admin/templates` has a "Default music" dropdown. Saved to `VideoTemplate.defaultMusicTrackId`.
3. **Generate** — `generate-remotion` reads the ACTIVE templates. Each reel inherits its template's default track automatically. The generate button offers an optional **batch override** (pick one track to apply to all variants this batch); leaving it at "No music" means "use each template's default".
4. **Per-reel override** — every Remotion row in the order's Reels list has its own music dropdown. Changing it re-renders just that reel with the new track.
5. **Baked in at render** — the chosen track URL goes into `inputProps.musicTrackUrl` via `MusicOverlay` (fade in/out).

### Resolution order (generate route)
```
perVariantMusic[variant] =
    hasBodyOverride ? body.musicTrackId          # batch override (if provided)
  : template.defaultMusicTrackId                 # otherwise template default
  : null                                         # otherwise no music
```

### Components
- `remotion-music-picker.tsx` — dropdown + pre-listen (used by the generate button).
- ReelsList per-row dropdown — per-reel override (Remotion reels only).
- `/admin/templates` — library management + per-template default.

---

## 11. Template Preview & Approval Workflow (your #6)

You want JSON2Video-like preview before templates go live: preview with **real data**, then "turn on" for production. Remotion Studio alone is not enough for non-developer review — you need previews embedded in the admin app.

### Two preview layers

**Layer 1 — Remotion Studio (developer/AI agent, local)**
- `npx remotion studio` — full props editor, timeline scrubber, interactivity
- Used during template creation with sample data
- Not exposed to production

**Layer 2 — Admin Template Preview (in-app, your workflow)**
- New admin page: `/admin/templates`
- Lists all 11 variants with status badge (DRAFT / ACTIVE) and "Preview" button
- Preview uses `@remotion/player` embedded in the page with **real data**
  - Pick a real order from a dropdown → loads its images, address, beds/baths, realtor headshot/phone/logo
  - Or use sample data presets
- Player renders at correct aspect ratio, in-browser, instant — no Lambda cost (previews are free, they don't count as Renders)
- Music pre-listen works here too

### Status lifecycle

```
DRAFT → (AI agent builds template) → preview in Studio + Admin
  → you approve → mark ACTIVE
  → ACTIVE templates appear in "Generate Remotion Reels"
  → edit later → back to DRAFT → preview → re-approve
```

- `generate-remotion/route.ts` only renders `ACTIVE` templates
- Draft templates never appear in the production generate flow
- Version column tracks iterations (`schemaJson` snapshot per version)

---

## 11b. Template Creation & Editing Workflow

How a new template (or an edit to an existing one) is built. Templates are **Remotion compositions** — plain `.tsx` files under `remotion/compositions/`, registered in `remotion/Root.tsx`. They are version-controlled and edited like code, then previewed before going ACTIVE.

### Best inputs to reproduce/change a design (in order of fidelity)

To build or modify a template I need a **precise spec**. Three options, best to least precise:

1. **JSON2Video JSON (best — recommended).** The JSON template is the exact machine-readable source of truth: every element's position (x/y), size, layer order, timing (start/duration), animation (keyframes/easings), colors, fonts, transitions, and media slots. From it I can reconstruct layout, motion, and timing deterministically and translate it into Remotion. **Provide this as the primary reference.**
2. **Rendered video / keyframes (visual ground-truth).** I can't "watch" a video, but I can extract frames (via FFmpeg) and analyze them as images — composition, spacing, typography, palette. Best used *with* the JSON to confirm the intended look and catch things the JSON doesn't express (e.g., how a transition actually reads).
3. **Written description (intent & deltas).** Great for describing what you want changed ("make the stat counters bigger", "swap the opener for a full-bleed image", "slow the transitions"). Use it to direct edits on top of option 1/2.

**Recommended combo:** send the JSON2Video JSON + the rendered video (I'll pull keyframes) + a short note on what to change. That gives me exact specs, a visual target, and your intent in one pass.

### The edit/build loop
1. You provide the reference (JSON / frames / notes).
2. I write or update the composition in `remotion/compositions/` (shared components first, reuse `PropertyCard`, `RealtorCard`, `ImageSlide`, `MusicOverlay`, transitions).
3. Register it in `Root.tsx` and seed/update its `VideoTemplate` row (DRAFT).
4. Preview live in `/admin/templates` (`@remotion/player`, sample data) and/or `npx remotion studio` (timeline scrubbing).
5. You review → approve → status set to ACTIVE (via the toggle in `/admin/templates`).
6. For tweaks: edit the composition → it's immediately reflected in the admin preview → re-approve. No migration or redeploy of the app is needed for composition changes; only the Remotion **site** is re-deployed (`npx remotion lambda sites create …`) before production renders pick up the change.

### Editing an existing template (e.g., Vertical Reel 1 — Just Listed)
Same loop. Give me the reference for the desired result (or describe the change), I edit `remotion/compositions/reels/ReelV1.tsx`, you preview in `/admin/templates`, approve. Since the template row stays ACTIVE and the composition is re-deployed to the Lambda site, regenerated reels use the updated design automatically.

---

## 12. Implementation Phases

### Phase 0 — Setup & Skills (this session)
- [x] Install Remotion packages (npm)
- [x] Run `npx remotion skills add` → symlink into `.kilo/skills/`
- [x] Create `remotion/` directory + `remotion.config.ts`
- [x] Shared Zod types (`remotion/lib/types.ts`)
- [x] Verify `npx remotion studio` runs

### Phase 1 — Shared Components
- [x] `ImageSlide` (Ken Burns), `PropertyCard`, `RealtorCard`, `BrandBar`, `MusicOverlay`
- [x] Register Google Fonts
- [ ] `TransitionSlide` (@remotion/transitions) — transitions used directly in `ReelV1` via `getTransition` instead

### Phase 2 — First Template (proof of concept)
- [x] `ReelV1` composition (1080×1920, ~18s)
- [x] `RemotionProvider` implementation (`lib/video/remotion-provider.ts`, imports from `@remotion/lambda/client`)
- [x] Deploy Lambda function in `ca-central-1` (function + site deployed; env wired)
- [x] `generate-remotion` API route + webhook route (`/api/integrations/remotion` with HMAC + token auth)
- [x] `VideoTemplate` migration + seed (all 11 as DRAFT, V1 ACTIVE)
- [x] End-to-end test: generate → render → S3 → display on delivery page ✅
- [x] ReelV1 approved / ACTIVE

### Phase 2b — Hardening (post-integration fixes, all done)
- [x] Delivery-page playback fix (removed `crossOrigin`; control bar restored)
- [x] Finished MP4 auto-copied Remotion bucket → `photos4remedia` (path-style URL detection)
- [x] Delete reel/video purges S3 + Remotion bucket (`deleteRender`) + DB
- [x] Per-reel music override in ReelsList (re-renders one reel)
- [x] Default music per template + batch override at generate
- [x] Sync route resilient to status-lookup errors

### Phase 3 — Remaining 10 Templates
- [x] ReelV2..V9 + SlideshowH1 + SlideshowH2 built
- [x] Still frames rendered and reviewed (V2–V9 @ frame 55; H1 @ frame 45; H2 @ frames 60 & 200)
- [x] Seed durations verified: reels 550f, slideshows 450f, ReelV1 390f
- [x] No visual blockers; ready for admin preview approval
- [ ] Mark DRAFT→ACTIVE via `/admin/templates` after bundle redeploy

### Phase 3b — New ReelV10 + Enhancement Packages
- [x] Installed enhancement packages: `@remotion/skia`, `@remotion/lottie`,
  `@remotion/transitions`, `@remotion/shapes`, `@remotion/paths`, `@remotion/media-utils`
- [x] Pinned all Remotion packages to `4.0.507` to avoid cross-version warnings
- [x] Added `Anton` and `BebasNeue` Google Fonts to `remotion/lib/fonts.ts`
- [x] Created `ReelV10` (Vertical Reel 10 - Just Listed):
  - 16s @ 30fps, 1080×1920
  - Scene 1: full-screen hero image with Ken Burns zoom, "JUST LISTED", street, city
  - Scene 2 & 3: animated blue-circle background video (`OffthreadVideo`), two
    stacked portrait images with slow zoom + white borders
  - Scene 4: agent logo, circular headshot, name, phone with staggered fade/scale
    transitions
- [x] Registered ReelV10 in `remotion/Root.tsx`, admin preview, provider variant map,
  seed script, and UI label maps

### Phase 4 — Music
- [x] `VideoMusicTrack` migration
- [x] Admin music management UI (`/admin/templates` → Add Music Track)
- [x] Tracks added via admin UI (tested)
- [x] `remotion-music-picker.tsx` (dropdown + pre-listen)
- [x] `defaultMusicTrackId` per template (dropdown on each template card)

### Phase 5 — UI Integration
- [x] `GenerateReelsRemotionButton` component
- [x] Update `ReelsList` — provider badge (J2V/Remotion), music column + per-reel picker
- [x] Sync/retry/cancel support for Remotion renders
- [x] Admin template preview page (`/admin/templates`) with `<Player>` (sample data; real order data pending)

### Phase 6 — Production rollout
- [ ] Env vars configured in Vercel (dev Lambda already deployed locally)
- [ ] Point production at the deployed Lambda / site
- [ ] Compare J2V vs Remotion output side by side
- [ ] Decide: keep both or retire J2V later

### Phase 7 — Free funnels (later stage, per your answer)
- [ ] `/free-reels` and `/free-slideshow` switch from J2V → Remotion
- [ ] Reuses same templates/providers; new submit routes

---

## 13. AWS Lambda Setup

```bash
# One-time setup
npx remotion lambda policies role    # Create IAM role
npx remotion lambda policies deploy  # Deploy policies

# Deploy render function (ca-central-1 confirmed)
npx remotion lambda functions deploy \
  --region=ca-central-1 \
  --memory=2048 \
  --disk=2048 \
  --timeout=120
```

**Estimated cost per render:** ~$0.01–0.05 (Lambda compute + S3). **Render time:** ~30–90s for 15s 1080p. **Previews via `<Player>`: $0.**

---

## 14. Environment Variables

```env
REMOTION_AWS_REGION=ca-central-1
REMOTION_FUNCTION_NAME=remotion-render-4-0-507-mem2048mb-disk2048mb-120sec
REMOTION_SERVE_URL=https://remotionlambda-cacentral1-<id>.s3.ca-central-1.amazonaws.com/sites/hdphotohub/index.html
REMOTION_BUCKET_NAME=remotionlambda-cacentral1-<id>   # Remotion's bucket (render progress + temp output; getRenderProgress needs it)
REMOTION_OUTPUT_BUCKET=                                # optional — write MP4 directly to your own bucket (needs extra Lambda IAM); leave unset: webhook copies into photos4remedia instead
REMOTION_AWS_ACCESS_KEY_ID=<key>
REMOTION_AWS_SECRET_ACCESS_KEY=<secret>
REMOTION_WEBHOOK_URL=http://localhost:3000/api/integrations/remotion   # production URL on Vercel
REMOTION_WEBHOOK_TOKEN=<secret>                        # HMAC secret; must match local + Vercel
REMOTION_QUEUE_CONCURRENCY=3                           # max renders started per queue batch (generate/webhook-chain/sync)
REMOTION_VARIANTS=v1-9x16                              # fallback active-variant list if VideoTemplate table is empty
```

**Note:** the finished MP4 lands in the Remotion bucket (lifecycle deletes it after ~1 day); the webhook copies it into `photos4remedia` automatically for permanence.

---

## 15. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Visual quality bar | Templates must look professional | Use Remotion agent skills; iterate in Studio + admin preview; you approve each template |
| Lambda cold start | First render slower | Acceptable for batch rendering; provisioned concurrency only if needed |
| React 19 / Next 15 compat | Build errors | Remotion 4.x supports React 19 (verified via npm) |
| Tailwind v4 in compositions | Styling conflicts | `@remotion/tailwind-v4` package exists |
| Music licensing | Legal risk if tracks misused | Your tracks are royalty-free; store license metadata in `VideoMusicTrack` |
| Free funnel switch | Scope creep | Deferred to Phase 7 (your explicit choice) |

---

## 16. Decisions Log (your answers)

| # | Question | Decision |
|---|---|---|
| 1 | Template visual style | Fresh style OK; professional + modern transitions via Remotion agent skills |
| 2 | Music | Royalty-free 10–20s tracks; per-reel dropdown with pre-listen; default per template |
| 3 | License / cost | **2 employees → free license. No $100/mo needed now or in production.** Subscribe only if >3 people |
| 4 | Lambda region | `ca-central-1` |
| 5 | Free funnels | Remotion later (Phase 7) — not in initial scope |
| 6 | Template preview | In-app admin preview (`/admin/templates`) with `<Player>` + real data + draft/active status; Studio for developer work |

---

## 17. Summary

| Aspect | Decision |
|---|---|
| Rendering engine | Remotion 4.x (current 4.0.507) |
| Render infrastructure | AWS Lambda, `ca-central-1` |
| Repository structure | Integrated into existing Next.js app |
| Provider pattern | New `RemotionProvider` alongside `J2VProvider` |
| DB changes | Additive only — `VideoMusicTrack`, `VideoTemplate`, `OrderReel.musicTrackId` |
| J2V coexistence | Both providers available; J2V unchanged |
| Music | Per-template default + batch override at generate + per-reel override; baked at render |
| Template specs | Build/edit from JSON2Video JSON + keyframes + notes (Section 11b); `.tsx` compositions, DRAFT→ACTIVE |
| Template lifecycle | DRAFT → admin preview with real data → ACTIVE → available in production |
| Preview | `@remotion/player` in admin UI (free, in-browser) + Remotion Studio for dev |
| AI workflow | Remotion agent skills installed to `.kilo/skills/`; Zod-typed props; hot reload |
| Packages | 11 new Remotion packages + existing deps reused |
| License | **Free (≤3 employees) — $0 during dev and production** |
