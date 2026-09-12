import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makePhoto(i: number): Promise<string> {
  const colors = ['#6f95a5', '#3d6677', '#cfc4af', '#92ad72'];
  const c = colors[i % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="800"><rect width="900" height="800" fill="${c}"/><rect x="100" y="260" width="700" height="360" fill="#f5f3eb"/><polygon points="40,320 450,40 860,320" fill="#77716d"/><rect x="230" y="400" width="150" height="220" fill="#536a7b"/><rect x="540" y="350" width="180" height="270" fill="#ffffff"/><circle cx="720" cy="680" r="95" fill="#347f8c"/><path d="M0 710 Q250 600 480 730 T900 680 V800 H0Z" fill="#5e8b4d"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#e1d0c5"/><circle cx="200" cy="145" r="72" fill="#6b4630"/><path d="M45 400 Q200 260 355 400 Z" fill="#25414b"/><circle cx="174" cy="145" r="7" fill="#222"/><circle cx="226" cy="145" r="7" fill="#222"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140"><rect width="400" height="140" fill="#0e7464"/><path d="M40 105 200 22l160 83-32 0-128-63-128 63z" fill="#243080"/><rect x="184" y="52" width="32" height="38" fill="#243080"/><text x="200" y="128" font-family="Georgia" font-size="28" fill="#1683a2" text-anchor="middle">Real Estate</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const photos = await Promise.all([makePhoto(0), makePhoto(1), makePhoto(2), makePhoto(3)]);
  const { png } = await renderSocialPost({
    variantKey: 'new-listing-3',
    label: 'NEW LISTING',
    images: photos,
    property: {
      address: '123 Anywhere St., Any City',
      city: 'Any City',
      province: 'ON',
      bedrooms: '4',
      bathrooms: '3',
      sqft: 1500,
    },
    realtor: {
      name: 'Estelle Darcy',
      phone: '+123-456-7890',
      companyName: 'Agency Name',
      headshotUrl: await makeHeadshot(),
      logoUrl: await makeLogo(),
    },
  });
  fs.writeFileSync(path.join(OUT, 'new-listing-3.png'), png);
  console.log(`OK new-listing-3 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();
