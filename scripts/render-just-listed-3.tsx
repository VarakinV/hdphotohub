import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makePhoto(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="800"><rect width="1080" height="800" fill="#152436"/><rect x="40" y="70" width="1000" height="400" rx="12" fill="#64778b"/><rect x="200" y="300" width="650" height="310" fill="#b48d5d"/><circle cx="880" cy="610" r="110" fill="#29452a"/><path d="M0 650 Q280 510 550 700 T1080 590 V800 H0Z" fill="#162319"/><circle cx="280" cy="170" r="90" fill="#f0b44e" opacity="0.8"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#d3af98"/><circle cx="200" cy="140" r="80" fill="#6b4633"/><path d="M45 400 Q200 245 355 400 Z" fill="#f0e8df"/><circle cx="174" cy="140" r="8" fill="#222"/><circle cx="226" cy="140" r="8" fill="#222"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140"><rect x="10" y="10" width="380" height="120" rx="18" fill="#ffffff"/><text x="200" y="88" font-family="Arial" font-weight="800" font-size="42" fill="#172436" text-anchor="middle">ACME REALTY</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const { png } = await renderSocialPost({
    variantKey: 'just-listed-3',
    label: 'Just Listed!',
    images: [await makePhoto()],
    property: {
      address: '123 Anywhere St., Any City',
      city: 'Any City',
      province: 'ON',
      postalCode: 'K1V 9S2',
      bedrooms: '4',
      bathrooms: '2',
      sqft: 2450,
      listPrice: 999999,
    },
    realtor: {
      name: 'Olivia Wilson',
      phone: '+123-456-7890',
      email: 'olivia@reallygreatsite.com',
      companyName: 'Ingoude Realty',
      headshotUrl: await makeHeadshot(),
      logoUrl: await makeLogo(),
    },
  });
  fs.writeFileSync(path.join(OUT, 'just-listed-3.png'), png);
  console.log(`OK just-listed-3 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();
