import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makePhoto(i: number): Promise<string> {
  const colors = ['#8bb1df', '#3e596d', '#d7d0c5', '#b7d1a3'];
  const accent = ['#ffffff', '#dce7ed', '#9fbce5', '#f1eee8'];
  const c = colors[i % colors.length];
  const a = accent[i % accent.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="800"><rect width="900" height="800" fill="${c}"/><rect x="130" y="160" width="640" height="440" fill="${a}"/><polygon points="80,300 450,40 820,300" fill="#b9aa98"/><rect x="260" y="350" width="150" height="250" fill="#6b8290"/><rect x="500" y="300" width="190" height="300" fill="#eef0ef"/><circle cx="710" cy="620" r="100" fill="#32768a"/><path d="M0 680 Q220 560 430 700 T900 650 V800 H0Z" fill="#5f7746"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><circle cx="200" cy="200" r="200" fill="#d7b29c"/><circle cx="200" cy="145" r="72" fill="#4e3024"/><path d="M45 400 Q200 260 355 400 Z" fill="#d8e0dc"/><circle cx="174" cy="145" r="7" fill="#222"/><circle cx="226" cy="145" r="7" fill="#222"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160"><rect width="400" height="160" fill="#0d2038"/><path d="M55 110 200 28l145 82-28 0-117-64-117 64z" fill="#ffffff"/><rect x="184" y="56" width="32" height="38" fill="#ffffff"/><text x="200" y="145" font-family="Arial" font-size="25" fill="#ffffff" text-anchor="middle">REALTY</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const photos = await Promise.all([makePhoto(0), makePhoto(1), makePhoto(2), makePhoto(3)]);
  const { png } = await renderSocialPost({
    variantKey: 'coming-soon-3',
    label: 'COMING SOON',
    images: photos,
    property: {
      address: '20729 Main St SE, Calgary',
      city: 'Calgary',
      province: 'AB',
      bedrooms: '2',
      bathrooms: '3',
      sqft: 1530,
    },
    realtor: {
      name: 'Realtor Name',
      phone: '123-456-7890',
      companyName: 'Real Estate Agency Name',
      headshotUrl: await makeHeadshot(),
      logoUrl: await makeLogo(),
    },
  });
  fs.writeFileSync(path.join(OUT, 'coming-soon-3.png'), png);
  console.log(`OK coming-soon-3 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();
