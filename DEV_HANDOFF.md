# Media Portal – Developer Handoff / Context Brief

This document summarizes the current state of the project, architecture, recent changes, and near‑term TODOs so another coding agent or developer can quickly continue work.

## Project Summary
- Product: Media Portal for real estate media management and public property websites.
- Core features:
  - Admin: manage realtors, orders, uploads (photos, videos, floor plans, attachments), delivery pages.
  - Portal (client): realtor login/access to their orders.
  - Public property websites with multiple templates (v1, v2, v3).
- Tech stack:
  - Next.js (App Router, TypeScript)
  - Tailwind CSS + Shadcn UI, Lucide icons
  - Prisma ORM (PostgreSQL)
  - Auth.js (NextAuth v5, role-based)
  - AWS S3 for media (presigned uploads)
  - Sharp for MLS resizing (1280px long edge)
  - Resend for email (invites, etc.)

## Run/Build
- Dev: `npm run dev`
- Type check: `npx tsc --noEmit`
- Prisma: `npx prisma generate`, `npx prisma migrate dev`, `npx prisma studio`
- Environment: requires DB url, Auth/NextAuth secrets, S3 config, Resend. See existing `.env.local` template variables throughout the codebase (not committed).

## Data Model (selected)
- prisma/schema.prisma (highlights):
  - User: `role` (SUPERADMIN/ADMIN/REALTOR), optional `realtorId` link
  - Realtor: `firstName`, `lastName`, `email`, `phone?`, `headshot?`, `companyName?`, `companyLogo?`, creator `userId`
  - Order: property fields (address, lat/lng, size, yearBuilt, mlsNumber, listPrice, bedrooms, bathrooms, featuresText, description), media relations, `status` (DRAFT/PUBLISHED/ARCHIVED)
  - Photo: `url`, `urlMls?`
  - FloorPlan, Video, Attachment, Embed, PropertyPage, PropertyInquiry

## Public Property Websites
- Route: `app/property/[orderId]/[template]/page.tsx`
  - Accepts template as "v1", "v2", "v3" or numeric. Logic extracts digits via `/\d+/`.
  - Renders one of: `PropertyTemplateV1/V2/V3`.
- Templates (key files):
  - `components/property/templates/PropertyTemplateV1.tsx`
    - HeroSlider; icon-based Property Details & Check-style Features; masonry-ish gallery.
  - `components/property/templates/PropertyTemplateV2.tsx`
    - Same Details/Features styling as V1; Photo Gallery uses crop‑based mosaic via CSS columns with varied fixed heights.
  - `components/property/templates/PropertyTemplateV3.tsx` (recently redesigned):
    - Hero uses full-screen slider (no dark overlay).
    - Left-start white address strip (auto width to text with padding).
    - Bottom edge is angled (currently very steep; clip-path at ~35–40%).
    - Realtor info card aligned to content width at bottom-right; includes company logo, larger headshot, larger name, clickable `tel:` phone, larger "Contact Me" button. On mobile the card is visible.
  - Shared components:
    - `components/property/TopAnchorMenu.tsx` — consistent header anchor links across templates.
    - `components/property/HeroSlider.tsx` — crossfade/zoom slider used by templates.
    - `components/delivery/PhotoLightbox.tsx` — modal for photos/floor plans.

## Recent Fixes & Changes (most relevant)
1) Variant routing bug fixed
   - Moved from `app/property/[orderId]/v[template]/page.tsx` to `app/property/[orderId]/[template]/page.tsx`.
   - Parse digits from the `template` segment to select 1/2/3; fallback to V1 when invalid.
2) V2 Mosaic
   - Implemented crop-based mosaic using CSS columns; V2 only. V1 and V3 use their own gallery layouts.
3) Styling unification
   - V2 and V3 now use V1’s icon-based Property Details and Check-list Features.
   - Added TopAnchorMenu to V2/V3; increased spacing below hero for V2/V3 to match V1.
4) V3 Hero redesign
   - Address strip: white, left-start, auto width to content; city/state line below; optional "Coming Soon" pill in non‑PUBLISHED status.
   - Realtor card (bottom-right): includes company logo (Realtor.companyLogo), larger headshot, larger name, clickable phone, larger “Contact Me” button; visible on mobile.
   - Angled bottom edge: steeper clip-path; line passes behind realtor card to create overlap look.

## Notable Paths
- Route selector: `app/property/[orderId]/[template]/page.tsx`
- Templates: `components/property/templates/PropertyTemplateV{1,2,3}.tsx`
- Portal/Admin: `/portal/*`, `/admin/*` (use Shadcn UI)
- API for realtor update (supports companyLogo cleanup): `app/api/realtors/[id]/route.ts`
- Realtor form (logo/headshot uploads to S3): `components/realtors/realtor-form.tsx`

## Conventions
- Tailwind utility-first; responsive via `sm/md/lg`.
- Icons via `lucide-react`.
- Section layout via small `Section` helpers in templates.
- Photo thumbnails open `PhotoLightbox` with `thumbClassName` to control crop.
- Property page anchors use ids: details, features, description, photos, floorplans, video, tours, map, contact.

## Pending / Backlog Ideas
- Templates:
  - V2 mosaic: add grid fallback for environments where `columns-*` is removed by Purge (not currently observed).
  - V3 hero: fine-tune mobile spacing/overlap; expose clip-path steepness via a constant.
  - SEO: per-template `<head>` social meta (OpenGraph/Twitter), structured data.
- Delivery page: immediate downloads everywhere (done); ensure video/floor plan download buttons always trigger download.
- Admin/Portal polish: pagination everywhere (added), consistent headers, invite buttons, etc.
- Media:
  - Ensure MLS 1280px variants are present (hybrid MLS fallback implemented); add “Regenerate MLS” admin action.
- Misc UX:
  - Add copy-to-clipboard for public delivery link when Published (green icon already planned/memory).

## Quick Handoff Prompt (paste into a new chat)
"""
You are joining a Next.js + Prisma + S3 project called Media Portal.
Key context:
- Public property websites route: app/property/[orderId]/[template]/page.tsx. Template segment can be "v1", "v2", or "v3"; digits are parsed to select template. Fallback to V1.
- Templates: components/property/templates/PropertyTemplateV1/V2/V3.tsx.
  - V1: icon-based details + check-list features; standard masonry gallery.
  - V2: same details/features styling; Photo Gallery is crop-based mosaic using CSS columns and varied fixed heights.
  - V3: hero redesigned — no dark overlay; left-start white address strip (auto-width); very steep angled white bottom edge; realtor card at bottom-right aligned to content width with company logo, larger headshot & name, tel: phone, and larger "Contact Me" button; visible on mobile.
- Shared: TopAnchorMenu, HeroSlider, PhotoLightbox.
- Data: prisma/schema.prisma has Realtor.companyLogo (used in V3 card), headshot, companyName; Order has property details + media relations.
- Known recent changes were concentrated in PropertyTemplateV2/V3 and the route file above.

What I want next:
- Continue refining V3 hero overlap on mobile/desktop; parameterize the angle (clip-path) and spacing constants.
- Evaluate adding a grid fallback for V2 mosaic if needed.
- Improve SEO/meta for property pages.
"""

## Contact / Inquiry
- Contact section on property pages posts to create `PropertyInquiry` (see components/property/ContactForm.tsx).

---
This file is intended to keep new collaborators or agents productive with minimal ramp-up. Update it as features evolve.

