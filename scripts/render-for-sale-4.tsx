import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makePhoto(i: number): Promise<string> {
  const colors = ['#6d9ab4', '#8fa58b', '#cdb89d', '#b8c7ff'];
  const c = colors[i % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="800"><rect width="900" height="800" fill="${c}"/><rect x="100" y="220" width="700" height="340" fill="#f4efe2"/><polygon points="40,290 450,30 860,290" fill="#7a756b"/><rect x="160" y="370" width="170" height="190" fill="#6a7a90"/><rect x="550" y="330" width="140" height="230" fill="#ffffff"/><circle cx="720" cy="560" r="90" fill="#546e5a"/><rect y="660" width="900" height="140" fill="#4b4e56"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#eef2f3"/><circle cx="200" cy="130" r="60" fill="#a67c52"/><path d="M55 400 Q190 240 345 400 Z" fill="#75838f"/><path d="M96 142 L200 232 L304 142" stroke="#ffffff" stroke-width="3" fill="none"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="70" viewBox="0 0 260 70"><rect width="260" height="70" fill="#ffffff"/><path d="M40 46 L78 22 L118 46 M84 36 L118 16 L154 36 M134 38 L168 18 L204 38" stroke="#2f6e3e" stroke-width="5.5" stroke-linejoin="round" fill="none"/><path d="M54 28 A10 9 0 1 0 76 10" fill="#78b355"/><path d="M186 32 A10 9 0 1 0 208 14" fill="#78b355"/><rect x="68" y="30" width="7" height="7" fill="#2f6e3e"/><rect x="78" y="30" width="7" height="7" fill="#2f6e3e"/><rect x="68" y="40" width="7" height="7" fill="#2f6e3e"/><rect x="78" y="40" width="7" height="7" fill="#2f6e3e"/><rect x="110" y="24" width="6" height="6" fill="#2f6e3e"/><rect x="120" y="24" width="6" height="6" fill="#2f6e3e"/><rect x="110" y="33" width="6" height="6" fill="#2f6e3e"/><rect x="120" y="33" width="6" height="6" fill="#2f6e3e"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const photos = await Promise.all([makePhoto(0), makePhoto(1), makePhoto(2), makePhoto(3), makePhoto(4)]);
  const { png } = await renderSocialPost({
    variantKey: 'for-sale-4',
    label: 'Home for Sale',
    images: photos,
    property: { address: '5991 Sample Street', city: 'Any City', bedrooms: '4', bathrooms: '3', sqft: 1580 },
    realtor: { name: 'Realtor Name', phone: '123-456-7890', companyName: 'Agency Name', headshotUrl: await makeHeadshot(), logoUrl: await makeLogo() },
  });
  fs.writeFileSync(path.join(OUT, 'for-sale-4.png'), png);
  console.log(`OK for-sale-4 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();
