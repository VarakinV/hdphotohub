// Seed the social media post template registry.
// Idempotent: upserts on variantKey.
// Run: node prisma/seed-social.cjs
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEMPLATES = [
  { variantKey: 'coming-soon', name: 'Coming Soon', label: 'COMING SOON', status: 'active', description: 'Hero photo with big serif COMING SOON headline, beds/baths/sqft strip, agent card.' },
  { variantKey: 'coming-soon-2', name: 'Coming Soon 2', label: 'COMING SOON', status: 'active', description: 'Full-bleed photo with top-right agency logo, large Coming Soon headline, phone-led bottom card, icon stats, address and agent mini-card.' },
  { variantKey: 'coming-soon-3', name: 'Coming Soon 3', label: 'COMING SOON', status: 'active', description: 'Split navy and photo layout with agency branding, address bar, collage photos, bed/bath/sqft icons, and realtor contact panel.' },
  { variantKey: 'coming-soon-4', name: 'Coming Soon 4', label: 'Coming Soon', status: 'active', description: 'Full-bleed property photo with rounded white listing card, red script headline, icon stats, and red agent/agency footer.' },
  { variantKey: 'just-listed', name: 'Just Listed', label: 'JUST LISTED', status: 'active', description: 'Bright badge style with photo collage and property stats.' },
  { variantKey: 'new-listing', name: 'New Listing', label: 'NEW LISTING', status: 'active', description: 'Two-photo layout with NEW LISTING banner and address.' },
  { variantKey: 'new-on-market', name: 'New on the Market', label: 'NEW ON THE MARKET', status: 'active', description: 'Split layout: big photo plus text block with stats.' },
  { variantKey: 'for-sale', name: 'For Sale', label: 'FOR SALE', status: 'active', description: 'Classic yard-sign style, bold headline over single photo.' },
  { variantKey: 'featured-listing', name: 'Featured Listing', label: 'FEATURED LISTING', status: 'active', description: 'Dark elegant layout with accent border and stats.' },
  { variantKey: 'price-reduced', name: 'Price Reduced', label: 'PRICE REDUCED', status: 'active', description: 'Price highlight layout showing list price.' },
  { variantKey: 'open-house', name: 'Open House', label: 'OPEN HOUSE', status: 'active', description: 'Open house announcement with QR code to property site.' },
  { variantKey: 'under-contract', name: 'Under Contract', label: 'UNDER CONTRACT', status: 'active', description: 'Muted tone with UNDER CONTRACT banner.' },
  { variantKey: 'sold', name: 'Sold', label: 'SOLD', status: 'active', description: 'Celebratory SOLD banner with photo and agent card.' },
  { variantKey: 'showcase', name: 'Showcase', label: '', status: 'active', description: 'Single full-bleed photo with minimal overlay, address and stats.' },
  { variantKey: 'agent-brand-card', name: 'Agent Brand Card', label: 'LET\'S CONNECT', status: 'active', description: 'Two-photo collage with prominent agent branding and contact info.' },
  { variantKey: 'new-listing-1', name: 'New Listing 1', label: 'NEW LISTING', status: 'active', description: 'Hero photo with address pill, 3-photo collage, light-blue band with large NEW LISTING headline, bed/bath/sqft bullets + agent card.' },
  { variantKey: 'new-listing-2', name: 'New Listing 2', label: 'New Listing', status: 'active', description: 'White editorial layout with agency branding, script New headline, right-side stats, two-photo strip and dark realtor footer with bordered headshot.' },
  { variantKey: 'new-listing-3', name: 'New Listing 3', label: 'NEW LISTING', status: 'active', description: 'Teal-framed hero with centered branding, three-photo collage, cream stats section and split realtor contact footer.' },
  { variantKey: 'new-listing-4', name: 'New Listing 4', label: 'NEW LISTING', status: 'active', description: 'Minimal cream layout with oversized NEW/LISTING typography, three-photo top collage, hero image, address ribbon and realtor details.' },
  { variantKey: 'just-listed-1', name: 'Just Listed 1', label: 'Just Listed', status: 'active', description: 'Top logo + script Just Listed headline, full-bleed hero with circular headshot overlapping, name+phone row, 3-column beds/baths/sqft.' },
  { variantKey: 'just-listed-2', name: 'Just Listed 2', label: 'JUST LISTED', status: 'active', description: 'Full-bleed property photo with sage overlay panel, beds/baths/sqft icon stats, address, realtor headshot, phone, agency name and logo.' },
  { variantKey: 'just-listed-3', name: 'Just Listed 3', label: 'Just Listed!', status: 'active', description: 'Twilight hero photo with black-and-gold listing panel, logo at top-left, address and beds/baths/sqft line, headshot and agent contact.' },
  { variantKey: 'just-listed-4', name: 'Just Listed 4', label: 'JUST LISTED', status: 'active', description: 'Warm split-background design with hero image, vertical three-photo collage, address ribbon, stat cards and realtor contact panel.' },
  { variantKey: 'for-sale-1', name: 'For Sale 1', label: 'FOR SALE', status: 'active', description: 'Light header with For Sale and dots, full-bleed hero, gold-trimmed navy base, three circular collage photos overlapping the curve, bulb stats inside outline box and realtor footer.' },
  { variantKey: 'for-sale-2', name: 'For Sale 2', label: 'PROPERTY FOR SALE', status: 'active', description: 'Twilight hero with gold/orange wavy divider, dark PROPERTY FOR SALE block with logo badge and agency name, two-row 2+2 gold-framed thumbnails, stats + realtor name, gold phone footer with headshot.' },
  { variantKey: 'for-sale-3', name: 'For Sale 3', label: 'For Sale', status: 'active', description: 'Cream editorial layout with tall framed hero, script For Sale heading, dark Home Features card with green checks, overlapping framed thumbnails, realtor headshot and phone footer.' },
  { variantKey: 'for-sale-4', name: 'For Sale 4', label: 'Home for Sale', status: 'active', description: 'White layout with curved hero, large Home for Sale headline, overlapping 2×2 photo grid, pill Features bar and headshot/phone footer.' },
  { variantKey: 'sold-1', name: 'Sold 1', label: 'JUST SOLD', status: 'active', description: 'Full-bleed modern house photo with translucent forest-green left panel, white V-notch JUST SOLD banner, property stats, address rule, circular headshot and realtor contact.' },
  { variantKey: 'sold-2', name: 'Sold 2', label: 'JUST SOLD!', status: 'active', description: 'White curved-header JUST SOLD design with This House script, full-width property photo, gold address pin, black contact footer, phone pill, circular headshot, white logo and dotted accent.' },
  { variantKey: 'sold-3', name: 'Sold 3', label: 'JUST Sold', status: 'active', description: 'Navy/top-beige diagonal header with JUST Sold, modern house photo, off-white THINKING OF SELLING panel, expert subtext, navy curved name pill and phone button with circular headshot.' },
  { variantKey: 'sold-4', name: 'Sold 4', label: 'Just SOLD', status: 'active', description: 'Gold/black/white layout with Just SOLD headline, full-width hero, 2×3 photo strip with framed center, gold-notched address ribbon, bulleted stats, realtor name + phone, and circular headshot.' },
];


async function main() {
  let created = 0;
  let updated = 0;
  for (let i = 0; i < TEMPLATES.length; i++) {
    const t = TEMPLATES[i];
    const { variantKey, ...data } = t;
    const existing = await prisma.socialPostTemplate.findUnique({ where: { variantKey } });
    await prisma.socialPostTemplate.upsert({
      where: { variantKey },
      update: { ...data, sortOrder: i },
      create: { variantKey, ...data, sortOrder: i },
    });
    if (existing) updated += 1;
    else created += 1;
  }
  console.log(`SocialPostTemplate: ${created} created, ${updated} updated, ${TEMPLATES.length} total.`);

  const active = await prisma.socialPostTemplate.count({ where: { status: 'active' } });
  console.log(`Active social templates: ${active}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
