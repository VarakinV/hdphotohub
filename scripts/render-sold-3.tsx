import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makeHero(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="800"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fadff"/><stop offset="0.5" stop-color="#f2d7b4"/><stop offset="1" stop-color="#84a1b8"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7f0f0"/><stop offset="1" stop-color="#3b5a6a"/></linearGradient></defs><rect width="1080" height="800" fill="url(#sky)"/><rect y="320" width="1080" height="480" fill="#2a3040"/><polygon points="0,360 420,170 1080,300 1080,500 0,500" fill="#202b39"/><polygon points="0,502 420,200 1080,330 1080,380 420,245 0,542" fill="#151d29"/><rect x="360" y="300" width="600" height="280" fill="url(#glass)"/><rect x="415" y="345" width="175" height="220" fill="#1f2e39"/><rect x="612" y="330" width="205" height="220" fill="#e9f0ed"/><rect x="842" y="350" width="118" height="210" fill="#203341"/><rect x="355" y="545" width="610" height="50" fill="#d8a661"/><rect x="106" y="460" width="140" height="90" fill="#d8a661" opacity="0.2"/><path d="M0 620 Q200 580 400 640 T720 630 T1080 600 V800 H0Z" fill="#5b8f4f"/><circle cx="740" cy="450" r="10" fill="#fff7c7"/><path d="M0 700 Q180 660 360 710 T720 700 T1080 680 V800 H0Z" fill="#356f38"/></svg>`;
  const buffer = await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="500" height="500" fill="#e4e0da"/><circle cx="250" cy="165" r="78" fill="#b77d5d"/><path d="M88 500 Q250 300 412 500Z" fill="#1a1d2f"/><path d="M128 155 Q210 28 318 100 Q338 135 326 190 Q280 125 198 130 Q168 138 128 155Z" fill="#c6a36b"/><circle cx="224" cy="168" r="7" fill="#1b1b1b"/><circle cx="282" cy="168" r="7" fill="#1b1b1b"/><path d="M220 220 Q250 236 280 220" stroke="#7f403d" stroke-width="6" fill="none"/></svg>`;
  return `data:image/png;base64,${(await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="150" viewBox="0 0 420 150"><rect width="420" height="150" fill="#d7bda6"/><g fill="none" stroke="#0f2438" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="M44 100 L118 38 L192 100"/><path d="M160 100 L232 42 L304 100"/><path d="M118 38 L118 100"/><path d="M232 42 L232 100"/><path d="M314 68 Q348 26 384 56"/></g><g fill="#0f2438"><rect x="98" y="68" width="12" height="12"/><rect x="126" y="68" width="12" height="12"/><rect x="98" y="86" width="12" height="12"/><rect x="126" y="86" width="12" height="12"/><rect x="215" y="70" width="12" height="12"/><rect x="243" y="70" width="12" height="12"/><rect x="215" y="88" width="12" height="12"/><rect x="243" y="88" width="12" height="12"/><circle cx="333" cy="46" r="4"/><circle cx="352" cy="40" r="3"/></g></svg>`;
  return `data:image/png;base64,${(await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64')}`;
}

async function main() {
  const { png } = await renderSocialPost({
    variantKey: 'sold-3',
    label: 'JUST Sold',
    images: [await makeHero()],
    property: { address: '123 Anywhere St., Any City, ST 12345' },
    realtor: { name: 'REBECCA MILES', phone: '+123-456-7890', companyName: 'AGENCY NAME', headshotUrl: await makeHeadshot(), logoUrl: await makeLogo() },
  });
  fs.writeFileSync(path.join(OUT, 'sold-3.png'), png);
  console.log(`OK sold-3 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();
