import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makePhoto(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="900"><rect width="1080" height="900" fill="#6d8799"/><rect x="90" y="210" width="900" height="500" fill="#e8e8e2"/><polygon points="40,300 540,20 1040,300" fill="#8d8175"/><rect x="260" y="420" width="190" height="290" fill="#596d7a"/><rect x="620" y="370" width="210" height="340" fill="#f8f8f4"/><circle cx="860" cy="750" r="130" fill="#438696"/><path d="M0 760 Q250 650 500 780 T1080 700 V900 H0Z" fill="#78a34c"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><circle cx="200" cy="200" r="200" fill="#d6b39e"/><circle cx="200" cy="145" r="72" fill="#4b3025"/><path d="M45 400 Q200 260 355 400 Z" fill="#f4f1e8"/><circle cx="174" cy="145" r="7" fill="#222"/><circle cx="226" cy="145" r="7" fill="#222"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140"><rect width="400" height="140" fill="#cf1015"/><path d="M40 102 200 22l160 80-30 0-130-62-130 62z" fill="#ffffff"/><rect x="184" y="50" width="32" height="40" fill="#ffffff"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const { png } = await renderSocialPost({
    variantKey: 'coming-soon-4',
    label: 'Coming Soon',
    images: [await makePhoto()],
    property: {
      address: '123 Anywhere St., Any City',
      city: 'Any City',
      province: 'ON',
      bedrooms: '4',
      bathrooms: '3',
      sqft: 2600,
    },
    realtor: {
      name: 'Brigitte Schwartz',
      phone: '+123-456-7890',
      companyName: 'Agency Name',
      headshotUrl: await makeHeadshot(),
      logoUrl: await makeLogo(),
    },
  });
  fs.writeFileSync(path.join(OUT, 'coming-soon-4.png'), png);
  console.log(`OK coming-soon-4 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();
