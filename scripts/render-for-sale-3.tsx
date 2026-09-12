import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makePhoto(i: number): Promise<string> {
  const colors = ['#9aa4c7', '#b8c2dc', '#d7c9b6', '#d5dbe1'];
  const c = colors[i % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1000"><rect width="900" height="1000" fill="${c}"/><rect x="80" y="320" width="740" height="400" fill="#b9b7ae"/><polygon points="30,380 450,80 870,380" fill="#3d4658"/><rect x="170" y="470" width="180" height="250" fill="#777d8a"/><rect x="515" y="440" width="175" height="280" fill="#e8e6de"/><rect x="215" y="505" width="120" height="100" fill="#e7b45d"/><rect x="535" y="500" width="125" height="100" fill="#d6e5ef"/><path d="M0 760 Q230 690 430 780 T900 750 V1000 H0Z" fill="#5a7353"/><rect y="870" width="900" height="130" fill="#4c5058"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#d9e0e0"/><circle cx="200" cy="130" r="65" fill="#b87950"/><path d="M42 400 Q200 260 358 400 Z" fill="#33465f"/><path d="M130 80 Q200 20 270 80" stroke="#2a2221" stroke-width="28" fill="none"/><circle cx="178" cy="132" r="5" fill="#222"/><circle cx="222" cy="132" r="5" fill="#222"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="180"><rect width="360" height="180" fill="#f1f0eb"/><path d="M35 155 V65 L120 5 V155 M120 155 V45 L205 115 V155 M205 155 V85 L290 155" stroke="#2f3542" stroke-width="8" fill="none"/><text x="12" y="178" font-family="Arial" font-size="28" letter-spacing="8" fill="#2f3542">REAL ESTATE</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const photos = await Promise.all([makePhoto(0), makePhoto(1), makePhoto(2), makePhoto(3)]);
  const { png } = await renderSocialPost({
    variantKey: 'for-sale-3',
    label: 'For Sale',
    images: photos,
    property: { address: '5991 Sample Street', city: 'Any City', bedrooms: '2', bathrooms: '2', sqft: 1480 },
    realtor: {
      name: 'Realtor Name',
      phone: '+123-456-7890',
      companyName: 'Real Estate',
      headshotUrl: await makeHeadshot(),
      logoUrl: await makeLogo(),
    },
  });
  fs.writeFileSync(path.join(OUT, 'for-sale-3.png'), png);
  console.log(`OK for-sale-3 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();
