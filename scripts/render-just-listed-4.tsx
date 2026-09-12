import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makePhoto(i: number): Promise<string> {
  const colors = ['#7b9baf', '#d8cfc2', '#6f8178', '#c6b39b'];
  const c = colors[i % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="800"><rect width="900" height="800" fill="${c}"/><rect x="100" y="240" width="700" height="380" fill="#eeeae2"/><polygon points="40,310 450,40 860,310" fill="#81786f"/><rect x="220" y="390" width="150" height="230" fill="#637889"/><rect x="520" y="350" width="170" height="270" fill="#f7f7f2"/><circle cx="700" cy="650" r="90" fill="#4c8190"/><path d="M0 700 Q250 600 480 720 T900 670 V800 H0Z" fill="#6a8549"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#8a9ba2"/><circle cx="200" cy="145" r="72" fill="#a9774e"/><path d="M45 400 Q200 260 355 400 Z" fill="#f2e8dc"/><circle cx="174" cy="145" r="7" fill="#222"/><circle cx="226" cy="145" r="7" fill="#222"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140"><rect width="400" height="140" fill="#4d403b"/><path d="M35 105 200 20l165 85-32 0-133-64-133 64z" fill="#ffffff"/><rect x="184" y="52" width="32" height="38" fill="#ffffff"/><text x="200" y="128" font-family="Arial" font-weight="700" font-size="24" fill="#ffffff" text-anchor="middle">BORCELLE</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const photos = await Promise.all([makePhoto(0), makePhoto(1), makePhoto(2), makePhoto(3)]);
  const { png } = await renderSocialPost({
    variantKey: 'just-listed-4',
    label: 'JUST LISTED',
    images: photos,
    property: {
      address: '20729 Main Street Southeast, Calgary',
      city: 'Calgary',
      province: 'AB',
      bedrooms: '4',
      bathrooms: '3',
      sqft: 3600,
    },
    realtor: {
      name: 'Adora Montminy',
      phone: '+123-456-7890',
      companyName: 'Agency Name',
      headshotUrl: await makeHeadshot(),
      logoUrl: await makeLogo(),
    },
  });
  fs.writeFileSync(path.join(OUT, 'just-listed-4.png'), png);
  console.log(`OK just-listed-4 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();
