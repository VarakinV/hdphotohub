import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makePhoto(i: number, w = 1080, h = 800): Promise<string> {
  const hues = ['12, 84%, 60%', '212, 70%, 50%', '150, 55%, 45%'];
  const h_ = hues[i % hues.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="hsl(${h_})"/><rect x="200" y="200" width="680" height="400" fill="rgba(255,255,255,0.25)"/><rect x="120" y="500" width="300" height="180" fill="rgba(255,255,255,0.18)"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><circle cx="200" cy="200" r="200" fill="hsl(30, 40%, 60%)"/><circle cx="200" cy="150" r="70" fill="hsl(30, 30%, 40%)"/><path d="M60 400 Q200 260 340 400 Z" fill="hsl(30, 35%, 45%)"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160"><rect x="20" y="20" width="360" height="120" rx="16" fill="#0f172a"/><text x="200" y="102" font-family="Arial" font-weight="800" font-size="52" fill="#ffffff" text-anchor="middle">ACME REALTY</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const photo = await makePhoto(0);
  const headshot = await makeHeadshot();
  const logo = await makeLogo();

  const { png } = await renderSocialPost({
    variantKey: 'just-listed-1',
    label: 'Just Listed',
    images: [photo],
    property: {
      address: '123 Anywhere St., Any City',
      city: 'Any City',
      province: 'ON',
      postalCode: 'K1V 9S2',
      bedrooms: '4',
      bathrooms: '2',
      sqft: 2450,
    },
    realtor: {
      name: 'Rebecca Miles',
      phone: '+123-456-7890',
      email: 'rebecca@reallygreatsite.com',
      companyName: 'Real Estate Agent Wardiere Inc.',
      headshotUrl: headshot,
      logoUrl: logo,
    },
  });
  fs.writeFileSync(path.join(OUT, 'just-listed-1.png'), png);
  console.log(`OK just-listed-1 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();
