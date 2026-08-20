// Seed Remotion template registry + (optionally) music tracks.
// Idempotent: upserts on variantKey. Only ReelV1 is built so far, so it is
// seeded as ACTIVE; other variants stay DRAFT until their composition exists.
// Run: node prisma/seed-remotion.cjs
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEMPLATES = [
  { variantKey: 'v1-9x16', compositionId: 'ReelV1', width: 1080, height: 1920, fps: 30, durationInFrames: 390, name: 'Vertical Reel 1 - Coming Soon', status: 'active', description: 'Coming Soon — white wave background, 5 image scenes with Ken Burns pan, address/city top, agent name + phone, circular headshot, logo, vertical COMING SOON banner.' },
  { variantKey: 'v2-9x16', compositionId: 'ReelV2', width: 1080, height: 1920, fps: 30, durationInFrames: 550, name: 'Vertical Reel 2 - For Sale', status: 'draft', description: 'FOR SALE opener variant with slide transitions.' },
  { variantKey: 'v3-9x16', compositionId: 'ReelV3', width: 1080, height: 1920, fps: 30, durationInFrames: 550, name: 'Vertical Reel 3 - Modern', status: 'draft', description: 'Modern minimal style.' },
  { variantKey: 'v4-9x16', compositionId: 'ReelV4', width: 1080, height: 1920, fps: 30, durationInFrames: 550, name: 'Vertical Reel 4 - Elegant', status: 'draft', description: 'Elegant serif-heavy style.' },
  { variantKey: 'v5-9x16', compositionId: 'ReelV5', width: 1080, height: 1920, fps: 30, durationInFrames: 550, name: 'Vertical Reel 5 - Bold', status: 'draft', description: 'Bold color-block style.' },
  { variantKey: 'v6-9x16', compositionId: 'ReelV6', width: 1080, height: 1920, fps: 30, durationInFrames: 550, name: 'Vertical Reel 6 - Minimal', status: 'draft', description: 'Minimal white-space style.' },
  { variantKey: 'v7-9x16', compositionId: 'ReelV7', width: 1080, height: 1920, fps: 30, durationInFrames: 550, name: 'Vertical Reel 7 - Luxury', status: 'draft', description: 'Luxury dark style.' },
  { variantKey: 'v8-9x16', compositionId: 'ReelV8', width: 1080, height: 1920, fps: 30, durationInFrames: 550, name: 'Vertical Reel 8 - Classic', status: 'draft', description: 'Classic real-estate style.' },
  { variantKey: 'v9-9x16', compositionId: 'ReelV9', width: 1080, height: 1920, fps: 30, durationInFrames: 550, name: 'Vertical Reel 9 - Seasonal', status: 'draft', description: 'Seasonal-themed style.' },
  { variantKey: 'v10-9x16', compositionId: 'ReelV10', width: 1080, height: 1920, fps: 30, durationInFrames: 480, name: 'Vertical Reel 10 - Just Listed', status: 'active', description: 'Just Listed — animated blue-circle background video, full-screen hero image, stacked dual-image scenes with slow zoom, agent logo/headshot/name/phone finale.' },
  { variantKey: 'v11-9x16', compositionId: 'ReelV11', width: 1080, height: 1920, fps: 30, durationInFrames: 495, name: 'Vertical Reel 11 - For Sale', status: 'active', description: 'For Sale — full-screen hero with translucent FOR SALE banner, tilted polaroid image pairs, wide zoom scene with CALL, persistent agent card/stat bar.' },
  { variantKey: 'v12-9x16', compositionId: 'ReelV12', width: 1080, height: 1920, fps: 30, durationInFrames: 360, name: 'Vertical Reel 12 - For Sale', status: 'active', description: 'For Sale — 4 image scenes with white V-cut overlay, top FOR SALE/address/city, centered agent headshot/name/phone/logo.' },
  { variantKey: 'v13-9x16', compositionId: 'ReelV13', width: 1080, height: 1920, fps: 30, durationInFrames: 525, name: 'Vertical Reel 13 - For Sale', status: 'active', description: 'For Sale — 5 image scenes with angled white overlay, top For Sale/address/city, bottom-right agent headshot/name/phone, bottom-left logo.' },
  { variantKey: 'v14-9x16', compositionId: 'ReelV14', width: 1080, height: 1920, fps: 30, durationInFrames: 330, name: 'Vertical Reel 14 - For Sale', status: 'active', description: 'For Sale — animated geometry blue-lines video background, two pairs of white-bordered images slide in from sides, top FOR SALE/address/city, agent name/phone/circular headshot/logo.' },
  { variantKey: 'v15-9x16', compositionId: 'ReelV15', width: 1080, height: 1920, fps: 30, durationInFrames: 300, name: 'Vertical Reel 15 - New Listing', status: 'active', description: 'New Listing — animated blue-green waves video background, three rotated white-bordered images appear sequentially, top NEW LISTING/address/city, agent name/phone/circular headshot/logo.' },
  { variantKey: 'v16-9x16', compositionId: 'ReelV16', width: 1080, height: 1920, fps: 30, durationInFrames: 300, name: 'Vertical Reel 16 - For Sale', status: 'active', description: 'For Sale — light-blue waves video background, full-width top hero images with Ken Burns zoom, centered circular headshot, FOR SALE/name/phone/logo/address/city.' },
  { variantKey: 'v17-9x16', compositionId: 'ReelV17', width: 1080, height: 1920, fps: 30, durationInFrames: 480, name: 'Vertical Reel 17 - New Listing', status: 'active', description: 'New Listing — first image full-screen at 50% opacity, top NEW LISTING, 6 photos slide through a horizontal carousel with center pause, SQ FT/BEDS/BATHS icons, street/city address, agency logo, dark finale with centered logo/headshot/name/phone.' },
  { variantKey: 'h1-16x9', compositionId: 'SlideshowH1', width: 1920, height: 1080, fps: 30, durationInFrames: 450, name: 'Horizontal Slideshow 1', status: 'active', description: '16:9 listing slideshow for websites/YouTube.' },
  { variantKey: 'h2-16x9', compositionId: 'SlideshowH2', width: 1920, height: 1080, fps: 30, durationInFrames: 450, name: 'Horizontal Slideshow 2', status: 'active', description: '16:9 slideshow variant with different pacing.' },
  { variantKey: 'h3-16x9', compositionId: 'SlideshowH3', width: 1920, height: 1080, fps: 30, durationInFrames: 690, name: 'Horizontal Slideshow 3', status: 'active', description: '16:9 For Sale slideshow — dark intro card with Home For Sale title/logo/address, 5 panned photo scenes with horizontal-slice transitions, left info panel with logo/stats/realtor card, dark outro with headshot sliding to the right plus logo/name/phone.' },
  { variantKey: 'h4-16x9', compositionId: 'SlideshowH4', width: 1920, height: 1080, fps: 30, durationInFrames: 738, name: 'Horizontal Slideshow 4', status: 'active', description: '16:9 Just Listed slideshow — full-bleed intro photo with Just Listed script title/address, 5 panned photo scenes with horizontal-slice transitions, persistent bottom stats bar/realtor card/logo, dark outro with headshot, red-bar name/phone and two tilted polaroid photos.' },
];

async function main() {
  let created = 0;
  let updated = 0;
  for (const t of TEMPLATES) {
    const { variantKey, ...data } = t;
    const existing = await prisma.videoTemplate.findUnique({ where: { variantKey } });
    await prisma.videoTemplate.upsert({
      where: { variantKey },
      update: { ...data },
      create: { variantKey, ...data },
    });
    if (existing) updated += 1;
    else created += 1;
  }
  console.log(`VideoTemplate: ${created} created, ${updated} updated, ${TEMPLATES.length} total.`);

  const active = await prisma.videoTemplate.count({ where: { status: 'active' } });
  const tracks = await prisma.videoMusicTrack.count();
  console.log(`Active templates: ${active}. Music tracks in library: ${tracks}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
