import fs from 'fs';
import path from 'path';

export type LoadedFont = {
  name: string;
  data: Buffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: 'normal' | 'italic';
};

let cached: LoadedFont[] | null = null;

const FONT_FILES: Array<{ file: string; name: string; weight: LoadedFont['weight']; style?: LoadedFont['style'] }> = [
  { file: 'inter-400.ttf', name: 'Inter', weight: 400 },
  { file: 'inter-600.ttf', name: 'Inter', weight: 600 },
  { file: 'inter-700.ttf', name: 'Inter', weight: 700 },
  { file: 'inter-800.ttf', name: 'Inter', weight: 800 },
  { file: 'playfair-700.ttf', name: 'Playfair Display', weight: 700 },
  { file: 'playfair-800.ttf', name: 'Playfair Display', weight: 800 },
  { file: 'playfair-italic-400.ttf', name: 'Playfair Display', weight: 400, style: 'italic' },
  { file: 'bebas-400.ttf', name: 'Bebas Neue', weight: 400 },
  { file: 'great-vibes-400.ttf', name: 'Great Vibes', weight: 400 },
  { file: 'instrument-serif-400.ttf', name: 'Instrument Serif', weight: 400 },
];

export function loadFonts(): LoadedFont[] {
  if (cached) return cached;
  const candidates = [
    path.join(process.cwd(), 'lib', 'social', 'fonts'),
    path.resolve(__dirname, 'fonts'),
  ];
  const dir = candidates.find((c) => fs.existsSync(c)) ?? candidates[0];
  cached = FONT_FILES.map((f) => ({
    name: f.name,
    weight: f.weight,
    style: f.style ?? 'normal',
    data: fs.readFileSync(path.join(dir, f.file)),
  }));
  return cached;
}
