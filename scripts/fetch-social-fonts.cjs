// Downloads static TTF font files for the social post renderer (satori).
// Sources: Fontsource CDN (static TTFs of the google/fonts OFL families).
// Run: node scripts/fetch-social-fonts.cjs
const fs = require('fs');
const path = require('path');

const FONTS = [
  { file: 'inter-400.ttf', url: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf' },
  { file: 'inter-600.ttf', url: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf' },
  { file: 'inter-700.ttf', url: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf' },
  { file: 'inter-800.ttf', url: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-800-normal.ttf' },
  { file: 'playfair-700.ttf', url: 'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-700-normal.ttf' },
  { file: 'playfair-800.ttf', url: 'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-800-normal.ttf' },
  { file: 'bebas-400.ttf', url: 'https://cdn.jsdelivr.net/fontsource/fonts/bebas-neue@latest/latin-400-normal.ttf' },
  { file: 'great-vibes-400.ttf', url: 'https://cdn.jsdelivr.net/fontsource/fonts/great-vibes@latest/latin-400-normal.ttf' },
  { file: 'playfair-italic-400.ttf', url: 'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-400-italic.ttf' },
  { file: 'instrument-serif-400.ttf', url: 'https://cdn.jsdelivr.net/fontsource/fonts/instrument-serif@latest/latin-400-normal.ttf' },
];

const OUT = path.join(__dirname, '..', 'lib', 'social', 'fonts');
fs.mkdirSync(OUT, { recursive: true });

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log(`  saved ${path.basename(dest)} (${(buf.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  for (const f of FONTS) {
    const dest = path.join(OUT, f.file);
    if (fs.existsSync(dest)) {
      console.log(`  exists ${f.file}`);
      continue;
    }
    await download(f.url, dest);
  }
  console.log('Done. Fonts saved to lib/social/fonts/');
}

main().catch((e) => { console.error(e); process.exit(1); });
