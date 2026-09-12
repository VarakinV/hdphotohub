import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makePhoto(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="1080" height="1350" fill="#d9d9d9"/><rect x="460" y="300" width="500" height="500" fill="#f4f4f4"/><rect x="60" y="780" width="600" height="400" fill="#c9b49a"/><circle cx="820" cy="1040" r="110" fill="#888888"/><rect x="120" y="500" width="220" height="300" fill="#e8e8e8"/><path d="M0 1180 Q300 1060 620 1200 T1080 1130 V1350 H0Z" fill="#b4b4b4"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><circle cx="200" cy="200" r="200" fill="#c9a078"/><circle cx="200" cy="145" r="68" fill="#7d6042"/><path d="M62 400 Q200 260 338 400 Z" fill="#96704a"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160"><rect x="20" y="20" width="360" height="120" rx="16" fill="#ffffff"/><text x="200" y="102" font-family="Arial" font-weight="800" font-size="46" fill="#60706a" text-anchor="middle">ACME REALTY</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const { png } = await renderSocialPost({
    variantKey: 'just-listed-2',
    label: 'JUST LISTED',
    images: [await makePhoto()],
    property: {
      address: '123 Anywhere St., Any City',
      city: 'Any City',
      province: 'ON',
      postalCode: 'K1V 9S2',
      bedrooms: '4',
      bathrooms: '2',
      sqft: 2450,
      listPrice: 750000,
    },
    realtor: {
      name: 'Rebecca Miles',
      phone: '+123-456-7890',
      companyName: 'Wardiere Inc.',
      headshotUrl: await makeHeadshot(),
      logoUrl: await makeLogo(),
    },
  });
  fs.writeFileSync(path.join(OUT, 'just-listed-2.png'), png);
  console.log(`OK just-listed-2 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();
