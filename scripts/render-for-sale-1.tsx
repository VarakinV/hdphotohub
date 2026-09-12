import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makePhoto(i: number): Promise<string> {
  const colors = ['#4a5a3b', '#c2c9b6', '#9fb9cc', '#d8cfc2'];
  const c = colors[i % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="800"><rect width="900" height="800" fill="${c}"/><rect x="90" y="220" width="720" height="380" fill="#eeece2"/><polygon points="30,300 450,15 870,300" fill="#7a756b"/><rect x="220" y="390" width="150" height="210" fill="#5a6d84"/><rect x="530" y="340" width="180" height="260" fill="#fafaf5"/><circle cx="710" cy="640" r="92" fill="#436f8b"/><path d="M0 690 Q250 590 480 710 T900 660 V800 H0Z" fill="#637a3d"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#d5dbe6"/><circle cx="200" cy="145" r="70" fill="#a9744a"/><path d="M45 400 Q200 265 355 400 Z" fill="#2f4a7a"/><circle cx="176" cy="144" r="6" fill="#222"/><circle cx="224" cy="144" r="6" fill="#222"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140"><rect width="400" height="140" fill="#eaf1fd"/><path d="M30 100 200 16l170 84-28 0-142-68-142 68z" fill="#0b5a2e"/><path d="M88 98 200 36l112 62-16 0-96-54-96 54z" fill="#0b5a2e"/><rect x="190" y="50" width="20" height="20" fill="#0b5a2e"/><rect x="140" y="82" width="16" height="16" fill="#0b5a2e"/><rect x="244" y="82" width="16" height="16" fill="#0b5a2e"/><text x="200" y="130" font-family="Arial" font-weight="700" font-size="22" fill="#163B7A" text-anchor="middle">Agency</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const photos = await Promise.all([makePhoto(0), makePhoto(1), makePhoto(2), makePhoto(3)]);
  const { png } = await renderSocialPost({
    variantKey: 'for-sale-1',
    label: 'FOR SALE',
    images: photos,
    property: {
      address: '20472 Main Street SE, Any City',
      city: 'Any City',
      province: 'Winnipeg',
      bedrooms: '3',
      bathrooms: '2',
      sqft: 1400,
    },
    realtor: {
      name: 'Realtor Name',
      phone: '204-731-2656',
      companyName: 'Agency Name',
      headshotUrl: await makeHeadshot(),
      logoUrl: await makeLogo(),
    },
  });
  fs.writeFileSync(path.join(OUT, 'for-sale-1.png'), png);
  console.log(`OK for-sale-1 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();
