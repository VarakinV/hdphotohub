import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderSocialPost } from '../lib/social/generator';

const OUT = path.join(__dirname, '..', 'out', 'social-preview');
fs.mkdirSync(OUT, { recursive: true });

async function makeHero(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="900"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b9be9"/><stop offset="0.58" stop-color="#f2d3bd"/><stop offset="1" stop-color="#6e8194"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e5eff0"/><stop offset="0.5" stop-color="#5f8996"/><stop offset="1" stop-color="#253d4e"/></linearGradient></defs><rect width="1080" height="900" fill="url(#sky)"/><rect y="590" width="1080" height="310" fill="#4a793f"/><polygon points="0,420 360,190 1080,280 1080,690 0,690" fill="#273542"/><polygon points="0,438 360,215 1080,300 1080,348 360,270 0,480" fill="#17222d"/><polygon points="0,535 360,310 1080,400 1080,760 0,760" fill="#3b4449"/><rect x="370" y="380" width="595" height="365" fill="url(#glass)"/><rect x="425" y="442" width="150" height="270" fill="#1d2b36"/><rect x="620" y="425" width="176" height="245" fill="#e3e9e5"/><rect x="835" y="445" width="102" height="255" fill="#203342"/><rect x="367" y="700" width="610" height="48" fill="#d8a661"/><rect x="0" y="753" width="1080" height="42" fill="#27343d"/><rect x="100" y="720" width="190" height="180" fill="#26313a"/><rect x="145" y="738" width="72" height="105" fill="#d6b174"/><rect x="242" y="738" width="44" height="105" fill="#496576"/><path d="M0 820 Q180 730 350 830 T700 815 T1080 800 V900 H0Z" fill="#315c34"/><circle cx="750" cy="534" r="12" fill="#fff0bd"/><circle cx="750" cy="534" r="6" fill="#fff"/></svg>`;
  const buffer = await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

async function makeHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="500" height="500" fill="#e7e8e9"/><circle cx="250" cy="160" r="82" fill="#b77c5d"/><path d="M62 500 Q250 285 438 500Z" fill="#9bb7cd"/><path d="M142 140 Q230 28 346 115 Q365 147 354 188 Q300 115 202 127 Q170 137 142 140Z" fill="#4b2c29"/><circle cx="220" cy="165" r="7" fill="#1b1b1b"/><circle cx="280" cy="165" r="7" fill="#1b1b1b"/><path d="M218 214 Q250 232 282 214" stroke="#7f413e" stroke-width="6" fill="none"/></svg>`;
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function makeLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="150" viewBox="0 0 420 150"><rect width="420" height="150" fill="#000000"/><g fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="M44 102 L120 36 L196 102"/><path d="M164 102 L236 42 L316 102"/><path d="M120 36 L120 102"/><path d="M236 42 L236 102"/><path d="M325 70 Q358 28 394 57"/></g><g fill="#ffffff"><rect x="96" y="69" width="13" height="13"/><rect x="126" y="69" width="13" height="13"/><rect x="96" y="88" width="13" height="13"/><rect x="126" y="88" width="13" height="13"/><rect x="219" y="70" width="13" height="13"/><rect x="249" y="70" width="13" height="13"/><rect x="219" y="89" width="13" height="13"/><rect x="249" y="89" width="13" height="13"/><path d="M350 43 Q362 13 375 41 Q363 37 350 43Z"/></g></svg>`;
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function main() {
  const { png } = await renderSocialPost({
    variantKey: 'sold-2',
    label: 'JUST SOLD!',
    images: [await makeHero()],
    property: { address: '123 Anywhere St.', city: 'Any City', province: 'ST', postalCode: '12345' },
    realtor: { name: 'Olivia Wilson', phone: '+1204-520-5623', companyName: 'Agency Name', headshotUrl: await makeHeadshot(), logoUrl: await makeLogo() },
  });
  fs.writeFileSync(path.join(OUT, 'sold-2.png'), png);
  console.log(`OK sold-2 (${(png.length / 1024).toFixed(0)} KB)`);
}

main();
