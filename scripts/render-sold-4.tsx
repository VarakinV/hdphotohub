import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makePhoto(i: number): Promise<string> {
  const colors = ['#7d8b8f', '#b9a88a', '#8fa3ad', '#c7b299'];
  const c = colors[i % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="900" height="700" fill="${c}"/><rect x="100" y="180" width="700" height="340" fill="#efe9dc"/><polygon points="30,260 450,30 870,260" fill="#6f6a63"/><rect x="150" y="330" width="160" height="190" fill="#5d6b78"/><rect x="560" y="300" width="150" height="220" fill="#f6f2e8"/><circle cx="720" cy="530" r="85" fill="#4c6b55"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="500" height="500" fill="#e6e7e8"/><circle cx="250" cy="160" r="82" fill="#b77c5d"/><path d="M62 500 Q250 285 438 500Z" fill="#2f4255"/><circle cx="222" cy="160" r="7" fill="#1b1b1b"/><circle cx="278" cy="160" r="7" fill="#1b1b1b"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="140" viewBox="0 0 380 140"><path d="M44 108 L118 40 L192 108 M150 108 L224 44 L298 108 M118 40 L118 108 M224 44 L224 108" stroke="#2f6e3e" stroke-width="8" fill="none" stroke-linejoin="round"/><text x="115" y="132" font-family="Arial" font-size="24" letter-spacing="3" fill="#111111">Agency</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const photos = await Promise.all([makePhoto(0), makePhoto(1), makePhoto(2), makePhoto(3)]);
  const { png } = await renderSocialPost({
    variantKey: 'sold-4',
    label: 'Just SOLD',
    images: photos,
    property: { address: '123 Anywhere St.', city: 'Any City', province: 'ST', postalCode: '12345', bedrooms: '4', bathrooms: '3', sqft: 2500 },
    realtor: { name: 'Maya Thompson', phone: '+123-456-7890', companyName: 'Agency Name', headshotUrl: await makeHeadshot(), logoUrl: await makeLogo() },
  });
  fs.writeFileSync(path.join(OUT, 'sold-4.png'), png);
  console.log(`OK sold-4 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();