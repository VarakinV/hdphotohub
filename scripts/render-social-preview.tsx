// Renders every social post template to PNG for local visual verification.
// Run: npx tsx scripts/render-social-preview.tsx
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makePhoto(i: number): Promise<string> {
  const hues = ['12, 84%, 60%', '212, 70%, 50%', '150, 55%, 45%'];
  const h = hues[i % hues.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="1080" height="1350" fill="hsl(${h})"/><rect width="1080" height="20" fill="rgba(255,255,255,0.35)" y="${200 + i * 180}"/><circle cx="540" cy="${200 + i * 180}" r="34" fill="rgba(255,255,255,0.5)"/><text x="540" y="640" font-family="Arial" font-size="90" fill="rgba(255,255,255,0.85)" text-anchor="middle">PHOTO ${i + 1}</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><circle cx="200" cy="200" r="200" fill="hsl(30, 40%, 60%)"/><circle cx="200" cy="150" r="70" fill="hsl(30, 30%, 40%)"/><path d="M60 400 Q200 260 340 400 Z" fill="hsl(30, 35%, 45%)"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160"><rect x="20" y="20" width="360" height="120" rx="16" fill="#0f172a"/><text x="200" y="102" font-family="Arial" font-weight="800" font-size="52" fill="#ffffff" text-anchor="middle">ACME REALTY</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

const VARIANTS = [
  'coming-soon',
  'just-listed',
  'new-listing',
  'new-on-market',
  'for-sale',
  'featured-listing',
  'price-reduced',
  'open-house',
  'under-contract',
  'sold',
  'showcase',
  'agent-brand-card',
];

async function main() {
  const photos = await Promise.all([makePhoto(0), makePhoto(1), makePhoto(2)]);
  const headshot = await makeHeadshot();
  const logo = await makeLogo();

  for (const v of VARIANTS) {
    try {
      const { png } = await renderSocialPost({
        variantKey: v,
        label: v === 'showcase' ? '' : v.replace(/-/g, ' ').toUpperCase(),
        images: photos,
        property: {
          address: '123 Maple Grove Ave',
          city: 'Ottawa',
          province: 'ON',
          postalCode: 'K1V 9S2',
          bedrooms: '4',
          bathrooms: '3',
          sqft: 2450,
          listPrice: 1249000,
        },
        realtor: {
          name: 'Sarah Mitchell',
          phone: '(613) 555-0123',
          email: 'sarah@acmerealty.com',
          companyName: 'ACME Realty',
          headshotUrl: headshot,
          logoUrl: logo,
        },
        qrUrl: 'https://example.com/property/demo',
      });
      fs.writeFileSync(path.join(OUT, `${v}.png`), png);
      console.log(`OK ${v} (${(png.length / 1024).toFixed(0)} KB)`);
    } catch (e: any) {
      console.error(`FAIL ${v}: ${e?.message}`);
    }
  }
  console.log(`Saved to ${OUT}`);
}

main();
