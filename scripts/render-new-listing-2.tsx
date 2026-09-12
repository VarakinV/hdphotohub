import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makePhoto(i: number): Promise<string> {
  const colors = ['#8daaba', '#b38e72'];
  const c = colors[i % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="800"><rect width="900" height="800" fill="${c}"/><rect x="100" y="250" width="700" height="380" fill="#f3f0e8"/><polygon points="40,310 450,50 860,310" fill="#776f68"/><rect x="240" y="400" width="150" height="230" fill="#637889"/><rect x="560" y="360" width="150" height="270" fill="#ffffff"/><circle cx="710" cy="680" r="100" fill="#3e7d8c"/><path d="M0 710 Q260 600 480 730 T900 680 V800 H0Z" fill="#70934c"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#8799a0"/><circle cx="200" cy="145" r="72" fill="#a6774d"/><path d="M45 400 Q200 260 355 400 Z" fill="#f1eee6"/><circle cx="174" cy="145" r="7" fill="#222"/><circle cx="226" cy="145" r="7" fill="#222"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140"><rect width="400" height="140" fill="#ffffff"/><path d="M40 105 200 22l160 83-32 0-128-63-128 63z" fill="#b78361"/><rect x="184" y="52" width="32" height="38" fill="#b78361"/><text x="200" y="128" font-family="Arial" font-weight="800" font-size="28" fill="#514643" text-anchor="middle">DWELL REALTOR</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const { png } = await renderSocialPost({
    variantKey: 'new-listing-2',
    label: 'New Listing',
    images: [await makePhoto(0), await makePhoto(1)],
    property: {
      address: '123 Anywhere St., Any City',
      city: 'Any City',
      province: 'ON',
      bedrooms: '4',
      bathrooms: '2',
      sqft: 1300,
    },
    realtor: {
      name: 'Rachel Akinwole-Smithington',
      phone: '+123-456-7890',
      companyName: 'Agency Name',
      headshotUrl: await makeHeadshot(),
      logoUrl: await makeLogo(),
    },
  });
  fs.writeFileSync(path.join(OUT, 'new-listing-2.png'), png);
  console.log(`OK new-listing-2 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();
