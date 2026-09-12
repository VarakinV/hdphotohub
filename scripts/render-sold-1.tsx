import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makeHero(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c98e8"/><stop offset="0.48" stop-color="#b5d9f5"/><stop offset="1" stop-color="#536d85"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9e7ed"/><stop offset="0.55" stop-color="#4c7081"/><stop offset="1" stop-color="#1b3445"/></linearGradient><linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f9b4e"/><stop offset="1" stop-color="#19371f"/></linearGradient></defs><rect width="1080" height="820" fill="url(#sky)"/><rect y="780" width="1080" height="570" fill="url(#grass)"/><polygon points="0,510 430,265 1080,390 1080,850 0,850" fill="#202b39"/><polygon points="0,535 430,298 1080,420 1080,478 430,365 0,602" fill="#111a26"/><polygon points="0,605 430,370 1080,490 1080,930 0,930" fill="#2a3038"/><rect x="380" y="445" width="580" height="430" fill="url(#glass)"/><rect x="455" y="520" width="145" height="260" fill="#1c2a38"/><rect x="635" y="505" width="170" height="245" fill="#dbe4e5"/><rect x="828" y="520" width="110" height="250" fill="#1f3241"/><rect x="380" y="830" width="610" height="50" fill="#dfb167"/><rect x="410" y="875" width="570" height="30" fill="#29323a"/><rect x="444" y="935" width="120" height="190" fill="#202a35"/><rect x="655" y="910" width="185" height="250" fill="#15202a"/><rect x="885" y="905" width="110" height="280" fill="#f0e9db"/><circle cx="765" cy="632" r="14" fill="#fff3cd"/><circle cx="765" cy="632" r="8" fill="#fff"/><circle cx="525" cy="685" r="10" fill="#f8d995"/><path d="M0 1050 Q210 940 380 1050 T760 1035 T1080 1040 V1350 H0Z" fill="#376b39"/><path d="M0 1190 Q190 1080 380 1190 T760 1165 T1080 1175 V1350 H0Z" fill="#214b2d"/><circle cx="160" cy="1110" r="52" fill="#477f3d"/><circle cx="285" cy="1088" r="42" fill="#558d42"/><circle cx="950" cy="1125" r="58" fill="#477b3c"/></svg>`;
  const buffer = await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#eef0e9"/><circle cx="200" cy="130" r="68" fill="#bc805b"/><path d="M48 400 Q200 250 352 400Z" fill="#405c67"/><path d="M122 107 Q160 28 252 73 Q285 90 284 145 Q243 102 176 103 Q146 105 122 107Z" fill="#4d2e28"/><circle cx="176" cy="140" r="6" fill="#222"/><circle cx="224" cy="140" r="6" fill="#222"/><path d="M175 176 Q200 190 225 176" stroke="#7b3e39" stroke-width="5" fill="none"/></svg>`;
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="150" viewBox="0 0 400 150"><rect width="400" height="150" fill="#30413D"/><g fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="M38 102 L112 36 L186 102"/><path d="M151 102 L218 43 L292 102"/><path d="M112 36 L112 102"/><path d="M218 43 L218 102"/><path d="M303 71 Q334 29 369 57"/></g><g fill="#ffffff"><rect x="91" y="69" width="12" height="12"/><rect x="119" y="69" width="12" height="12"/><rect x="91" y="87" width="12" height="12"/><rect x="119" y="87" width="12" height="12"/><rect x="201" y="72" width="12" height="12"/><rect x="229" y="72" width="12" height="12"/><rect x="201" y="90" width="12" height="12"/><rect x="229" y="90" width="12" height="12"/><path d="M330 45 Q341 16 353 42 Q343 39 330 45Z"/></g></svg>`;
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function main() {
  const { png } = await renderSocialPost({
    variantKey: 'sold-1',
    label: 'JUST SOLD',
    images: [await makeHero()],
    property: {
      address: '123 Anywhere St.',
      city: 'Any City',
      province: 'ST',
      postalCode: '12345',
      bedrooms: '3',
      bathrooms: '2',
      sqft: 1950,
    },
    realtor: {
      name: 'Realtor Name',
      phone: '+123-456-7890',
      companyName: 'Agency Name',
      headshotUrl: await makeHeadshot(),
      logoUrl: await makeLogo(),
    },
  });
  fs.writeFileSync(path.join(OUT, 'sold-1.png'), png);
  console.log(`OK sold-1 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();
