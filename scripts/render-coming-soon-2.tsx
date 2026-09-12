import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makePhoto(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="1080" height="1350" fill="#91a5bd"/><rect x="0" y="380" width="1080" height="560" fill="#8b775f"/><path d="M0 720 L280 420 L560 720 L820 430 L1080 720 V1350 H0Z" fill="#c7b08c"/><rect x="90" y="820" width="200" height="300" fill="#f7f4ee"/><rect x="740" y="780" width="250" height="300" fill="#efece5"/><circle cx="870" cy="1060" r="120" fill="#48683f"/><path d="M0 1100 Q300 980 560 1140 T1080 1040 V1350 H0Z" fill="#526043"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><circle cx="200" cy="200" r="200" fill="#ddb69d"/><circle cx="200" cy="145" r="70" fill="#4a3024"/><path d="M48 400 Q200 260 352 400 Z" fill="#f1f1ed"/><circle cx="174" cy="145" r="7" fill="#222"/><circle cx="226" cy="145" r="7" fill="#222"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140"><rect x="10" y="10" width="380" height="120" rx="18" fill="#ffffff"/><text x="200" y="88" font-family="Arial" font-weight="800" font-size="42" fill="#5b623e" text-anchor="middle">ACME REALTY</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const { png } = await renderSocialPost({
    variantKey: 'coming-soon-2',
    label: 'COMING SOON',
    images: [await makePhoto()],
    property: {
      address: '123 Anywhere St., Any City',
      city: 'Any City',
      province: 'ON',
      postalCode: 'K1V 9S2',
      bedrooms: '4',
      bathrooms: '4',
      sqft: 1500,
    },
    realtor: {
      name: 'Rebecca Miles',
      phone: '+123-456-7890',
      companyName: 'Wardiere Inc.',
      headshotUrl: await makeHeadshot(),
      logoUrl: await makeLogo(),
    },
  });
  fs.writeFileSync(path.join(OUT, 'coming-soon-2.png'), png);
  console.log(`OK coming-soon-2 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();
