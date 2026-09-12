// Shared design system for social media post templates.

export const BRAND = '#ca4153';
export const BRAND_DARK = '#9f3343';
export const INK = '#111827';
export const PAPER = '#ffffff';
export const MUTED = '#6b7280';
export const DARK = '#0f172a';
export const GOLD = '#c9a227';
export const LINE = '#e5e7eb';
export const NL1_BAND = '#9fb3d8';
export const NL1_BAND_DARK = '#1f2a44';

export const FONT_SANS = 'Inter';
export const FONT_SERIF = 'Playfair Display';
export const FONT_DISPLAY = 'Bebas Neue';
export const FONT_SCRIPT = 'Great Vibes';
export const FONT_INSTRUMENT = 'Instrument Serif';

function iconDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function strokeIcon(paths: string, color: string): string {
  return iconDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
  );
}

function fillIcon(paths: string, color: string): string {
  return iconDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}">${paths}</svg>`
  );
}

export const bedIcon = (color: string) =>
  strokeIcon(
    `<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>`,
    color
  );

export const bathIcon = (color: string) =>
  strokeIcon(
    `<path d="M10 4 8 6"/><path d="M17 19v2"/><path d="M2 12h20"/><path d="M7 19v2"/><path d="M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>`,
    color
  );

export const sqftIcon = (color: string) =>
  strokeIcon(
    `<path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13"/><path d="m8 6 2-2"/><path d="m18 16 2-2"/><path d="m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>`,
    color
  );

export const phoneIcon = (color: string) =>
  strokeIcon(
    `<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>`,
    color
  );

export const pinIcon = (color: string) =>
  strokeIcon(
    `<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>`,
    color
  );

export const cameraIcon = (color: string) =>
  strokeIcon(
    `<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>`,
    color
  );

export const checkIcon = (color: string) =>
  strokeIcon(`<path d="M20 6 9 17l-5-5"/>`, color);
