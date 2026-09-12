import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makePhoto(i: number): Promise<string> {
  const colors = ['#2a3140', '#4f6a7a', '#e8dfcf', '#abb8c6'];
  const c = colors[i % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="900" height="700" fill="${c}"/><rect x="100" y="150" width="700" height="340" fill="#ddd8c6"/><polygon points="20,220 450,15 880,220" fill="#5b5a52"/><rect x="230" y="320" width="120" height="170" fill="#223042"/><rect x="560" y="310" width="120" height="180" fill="#f5efe2"/><circle cx="720" cy="540" r="80" fill="#4a6353"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#e8e2d9"/><circle cx="200" cy="130" r="62" fill="#8c5a3a"/><path d="M60 400 Q200 270 340 400 Z" fill="#6b8ea8"/><circle cx="182" cy="132" r="5" fill="#222"/><circle cx="218" cy="132" r="5" fill="#222"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#ffffff"/><path d="M40 220 L200 90 L360 220 L312 220 L200 125 L88 220 Z" fill="#8a735e"/><path d="M60 280 L200 155 L340 280 L293 280 L200 198 L107 280 Z" fill="#c69b1a"/><rect x="182" y="140" width="12" height="12" fill="#222"/><rect x="198" y="140" width="12" height="12" fill="#222"/><rect x="182" y="156" width="12" height="12" fill="#222"/><rect x="198" y="156" width="12" height="12" fill="#222"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const photos = await Promise.all([makePhoto(0), makePhoto(1), makePhoto(2), makePhoto(3), makePhoto(4)]);
  const { png } = await renderSocialPost({
    variantKey: 'for-sale-2',
    label: 'PROPERTY FOR SALE',
    images: photos,
    property: { address: 'Anywhere', bedrooms: '2', bathrooms: '3', sqft: 1820 },
    realtor: {
      name: 'Realtor Name',
      phone: '204-730-1005',
      companyName: 'Agency Name',
      headshotUrl: await makeHeadshot(),
      logoUrl: await makeLogo(),
    },
  });
  fs.writeFileSync(path.join(OUT, 'for-sale-2.png'), png);
  console.log(`OK for-sale-2 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();
