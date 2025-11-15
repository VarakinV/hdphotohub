import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export type FlyerVariant = 'f1' | 'f2' | 'f3';

export type FlyerInput = {
  address: string;
  realtor: {
    name: string;
    phone?: string | null;
    email?: string | null;
    headshot?: string | null;
    logo?: string | null;
  };
  images: string[]; // 3..6
  beds?: string | null;
  baths?: string | null;
  sizeSqFt?: number | string | null;
  qrUrl: string; // property page URL
  variant: FlyerVariant;
  // Render size for preview screenshot; PDF will always be Letter
  widthPx?: number; // default ~1275 (8.5in * 150dpi)
  heightPx?: number; // default ~1650 (11in * 150dpi)
};

// Brand color and simple theme
const BRAND = '#ca4153';
const BG = '#ffffff';
const TEXT = '#111827';

function safe(v: any) {
  return v == null ? '' : String(v);
}

async function buildQrDataUrl(url: string) {
  try {
    return await QRCode.toDataURL(url, { margin: 0 });
  } catch {
    return '';
  }
}

function baseStyles() {
  return `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; background: ${BG}; color: ${TEXT}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; }
  .page { width: 100%; min-height: 100vh; height: auto; padding: 24px; display: flex; flex-direction: column; gap: 14px; }
  .page.f2 { position: relative; padding: 24px; overflow: hidden; }
  .f2-frame { position: relative; width: 100%; min-height: calc(100vh - 48px); }

  /* Hero */
  .hero { position: relative; width: 100%; border-radius: 10px; overflow: hidden; }
  .hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .addr-overlay { position: absolute; left: 18px; right: 18px; bottom: 18px; color: #fff; text-shadow: 0 2px 6px rgba(0,0,0,.45); }
  .addr-line { font-size: 56px; font-weight: 800; letter-spacing: 0.5px; line-height: 1.05; text-transform: uppercase; }

  /* Collage */
  .grid { display: grid; gap: 8px; grid-template-columns: repeat(3, 1fr); }
  .grid2 { display: grid; gap: 10px; grid-template-columns: repeat(2, 1fr); }
  .grid img.photo { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 8px; }
  .grid2 img.photo { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 8px; }

  /* Contact / footer */
  .contact { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-top: 10px; border-top: 2px solid ${BRAND}; }
  .left { display: flex; align-items: center; gap: 12px; }
  .headshot { width: 84px; height: 84px; border-radius: 8px; object-fit: cover; }
  .ctext { line-height: 1.2; }
  .name { font-weight: 800; font-size: 18px; }
  .details { color: #374151; font-size: 14px; }
  .logo { max-height: 40px; display: block; }
  .contact-lines { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
  .contact-line { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #374151; }
  .contact-line .icon svg { width: 16px; height: 16px; color: ${BRAND}; display: block; }


  /* Stats with external icons */
  .statsx { display: flex; align-items: center; gap: 14px; font-weight: 700; }
  .stat-item { display: flex; align-items: center; gap: 8px; }
  .stat-box { border: 1px solid #e5e7eb; padding: 6px 10px; border-radius: 8px; display: flex; flex-direction: column; line-height: 1.05; min-width: 70px; }
  .stat-num { font-weight: 800; font-size: 16px; }
  .stat-label { color: #6b7280; font-size: 12px; margin-top: 2px; }
  .stat-icon svg { width: 20px; height: 20px; color: ${BRAND}; display: block; }

  .qr { width: 112px; height: 112px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; background: #fff; }
  .muted { color: #6b7280; font-size: 12px; text-align: right; }

  /* F2 specific overlays */
  .f2-leftband { position: absolute; top: 24px; bottom: 24px; left: 24px; width: 20%; background: #ffffff; z-index: 2; border-radius: 10px; }
  .f2-hero { position: absolute; left: 24px; right: 24px; top: 24px; bottom: 160px; z-index: 1; border-radius: 10px; overflow: hidden; }
  .f2-hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .f2-thumbs { position: absolute; left: calc(20% - 8% + 24px); top: 160px; display: flex; flex-direction: column; gap: 10px; width: 21.6%; z-index: 3; }
  .f2-thumbs img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,.25); }
  .f2-agent { position: absolute; top: 24px; left: calc(20% - 8% + 24px); background: #fff; border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; box-shadow: 0 6px 20px rgba(0,0,0,.15); z-index: 3; }
  .f2-agent .h { width: 54px; height: 54px; border-radius: 8px; object-fit: cover; }
  .f2-agent .t { line-height: 1.2; }
  .f2-agent .n { font-weight: 800; }
  .f2-addr { position: absolute; left: calc(24px + 4%); top: 24px; writing-mode: vertical-rl; transform: rotate(180deg); font-weight: 700; color: #111; background: rgba(255,255,255,.9); padding: 6px 4px; border-radius: 6px; z-index: 3; }
  .f2-bottom { position: absolute; left: calc(20% - 8% + 24px); right: 24px; bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; z-index: 3; }
  .f2-stats-wrap { background: rgba(255,255,255,.92); border-radius: 10px; padding: 8px 10px; }
  .f2-qr-wrap { display: flex; align-items: center; gap: 10px; }
  .f2-logo { position: absolute; right: 24px; bottom: 24px; max-height: 48px; z-index: 3; }
  .f2-spacer { height: 0; }

  /* F3 specific */
  .page.f3 { gap: 10px; }
  .page.f3 .grid2 { gap: 8px; }
  .f3-addrbar { background: #ffffff; color: #111; padding: 8px 12px; border-radius: 8px; }
  .f3-addrbar .addr { font-size: 23px; font-weight: 800; letter-spacing: 0.3px; }
  .f3-full img { width: 100%; aspect-ratio: 21/10; object-fit: cover; border-radius: 8px; }
  .page.f3 .grid2 img.photo { aspect-ratio: 21/10; }
  `;
}

function thumbsGridHtml(urls: string[]) {
  const thumbs = urls.slice(0, 5); // after hero, show up to 5 remaining images
  return `
    <div class="grid">
      ${thumbs.map((u) => `<img class=\"photo\" src=\"${u}\" />`).join('')}
    </div>
  `;
}

function twoColGridHtml(urls: string[]) {
  const thumbs = urls.slice(0, 4);
  return `
    <div class="grid2">
      ${thumbs.map((u) => `<img class="photo" src="${u}" />`).join('')}
    </div>
  `;
}

function leftBlockHtml(inp: FlyerInput) {
  const phoneLine = inp.realtor.phone ? `<div class="contact-line"><span class=\"icon\">${phoneIconSvg()}</span><span>${safe(inp.realtor.phone)}</span></div>` : '';
  const emailLine = inp.realtor.email ? `<div class=\"contact-line\"><span class=\"icon\">${mailCheckIconSvg()}</span><span>${safe(inp.realtor.email)}</span></div>` : '';
  return `
    <div class="left">
      ${inp.realtor.headshot ? `<img class="headshot" src="${inp.realtor.headshot}" alt="Headshot" />` : ''}
      <div class="ctext">
        ${inp.realtor.logo ? `<img class="logo" src="${inp.realtor.logo}" alt="Brokerage" />` : ''}
        <div class="name">${safe(inp.realtor.name)}</div>
        <div class="contact-lines">${phoneLine}${emailLine}</div>
      </div>
    </div>`;
}

// Simple inline SVG icons
function bedIconSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
    <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
    <path d="M12 4v6" />
    <path d="M2 18h20" />
  </svg>`;
}
function bathIconSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 4 8 6" />
    <path d="M17 19v2" />
    <path d="M2 12h20" />
    <path d="M7 19v2" />
    <path d="M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
  </svg>`;
}
function sqftIconSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13" />
    <path d="m8 6 2-2" />
    <path d="m18 16 2-2" />
    <path d="m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17" />
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    <path d="m15 5 4 4" />
  </svg>`;
}

function phoneIconSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
  </svg>`;
}
function mailCheckIconSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    <path d="m16 19 2 2 4-4" />
  </svg>`;
}


function statsWithIconsHtml(inp: FlyerInput) {
  const items: Array<{ icon: string; num: string; label: string }> = [];
  if (inp.beds) items.push({ icon: bedIconSvg(), num: safe(inp.beds), label: 'Beds' });
  if (inp.baths) items.push({ icon: bathIconSvg(), num: safe(inp.baths), label: 'Baths' });
  if (inp.sizeSqFt) items.push({ icon: sqftIconSvg(), num: safe(inp.sizeSqFt), label: 'Sq Ft' });
  if (!items.length) return '';
  return `<div class="statsx">${items
    .map((it) => `<div class=\"stat-item\"><span class=\"stat-icon\">${it.icon}</span><div class=\"stat-box\"><div class=\"stat-num\">${it.num}</div><div class=\"stat-label\">${it.label}</div></div></div>`)
    .join('')}</div>`;
}

function htmlF1(inp: FlyerInput, qrDataUrl: string) {
  const [hero, ...rest] = inp.images.slice(0, 5);
  const heroHtml = hero ? `
    <div class="hero" style="aspect-ratio: 11 / 4;">
      <img src="${hero}" alt="Hero" />
      <div class="addr-overlay"><div class="addr-line" style="font-size: 38px;">${safe(inp.address)}</div></div>
    </div>
  ` : '';
  const collage = rest.length ? twoColGridHtml(rest) : '';
  const qrHtml = `
    ${qrDataUrl ? `<img class=\"qr\" src=\"${qrDataUrl}\" alt=\"QR\" />` : ''}
  `;
  return `
<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safe(inp.address)} - Flyer 1</title>
<style>${baseStyles()}</style></head><body>
  <div class="page">
    ${heroHtml}
    ${collage}
    <div class="contact">
      ${leftBlockHtml(inp)}
      ${statsWithIconsHtml(inp)}
      ${qrHtml}
    </div>
  </div>
</body></html>`;
}

function htmlF2(inp: FlyerInput, qrDataUrl: string) {
  const [hero, ...rest] = inp.images;
  const thumbs = rest.slice(0, 5);
  const agentPhone = inp.realtor.phone ? `<div class=\"contact-line\"><span class=\"icon\">${phoneIconSvg()}</span><span>${safe(inp.realtor.phone)}</span></div>` : '';
  const agentEmail = inp.realtor.email ? `<div class=\"contact-line\"><span class=\"icon\">${mailCheckIconSvg()}</span><span>${safe(inp.realtor.email)}</span></div>` : '';
  const agent = `
    <div class=\"f2-agent\">
      ${inp.realtor.headshot ? `<img class=\"h\" src=\"${inp.realtor.headshot}\" alt=\"Headshot\" />` : ''}
      <div class=\"t\">
        <div class=\"n\">${safe(inp.realtor.name)}</div>
        <div class=\"contact-lines\">${agentPhone}${agentEmail}</div>
        ${inp.realtor.logo ? `<img class=\"logo\" src=\"${inp.realtor.logo}\" alt=\"Brokerage\" style=\"margin-top:6px; max-height:32px;\" />` : ''}
      </div>
    </div>`;
  const thumbCol = `
    <div class="f2-thumbs">${thumbs.map((u) => `<img src=\"${u}\" />`).join('')}</div>`;
  const addrVert = `<div class="f2-addr">${safe(inp.address)}</div>`;
  const bottom = `
    <div class="f2-bottom">
      <div class="f2-stats-wrap">${statsWithIconsHtml(inp)}</div>
      <div class="f2-qr-wrap">
        ${qrDataUrl ? `<img class=\"qr\" src=\"${qrDataUrl}\" alt=\"QR\" />` : ''}
      </div>
    </div>`;
  return `
<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safe(inp.address)} - Flyer 2</title>
<style>${baseStyles()}</style></head><body>
  <div class="page f2">
    <div class="f2-frame">
      <div class="f2-hero">${hero ? `<img src=\"${hero}\" alt=\"Hero\" />` : ''}</div>
      <div class="f2-leftband"></div>
      ${agent}
      ${thumbCol}
      ${addrVert}
      ${bottom}
      <div class="f2-spacer"></div>
      </div>
    </div>
  </div>
</body></html>`;
}

function htmlF3(inp: FlyerInput, qrDataUrl: string) {
  const [i1, i2, i3, i4, i5] = inp.images;
  const addrHtml = `
    <div class="f3-addrbar"><div class="addr">${safe(inp.address)}</div></div>`;
  const row1 = (i1 || i2) ? `
    <div class="grid2">
      ${i1 ? `<img class="photo" src="${i1}" />` : ''}
      ${i2 ? `<img class="photo" src="${i2}" />` : ''}
    </div>` : '';
  const row2 = i3 ? `<div class="f3-full"><img src="${i3}" alt="Photo" /></div>` : '';
  const row3 = (i4 || i5) ? `
    <div class="grid2">
      ${i4 ? `<img class="photo" src="${i4}" />` : ''}
      ${i5 ? `<img class="photo" src="${i5}" />` : ''}
    </div>` : '';
  const qrHtml = `
    ${qrDataUrl ? `<img class=\"qr\" src=\"${qrDataUrl}\" alt=\"QR\" />` : ''}
  `;
  return `
<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safe(inp.address)} - Flyer 3</title>
<style>${baseStyles()}</style></head><body>
  <div class="page f3">
    ${addrHtml}
    ${row1}
    ${row2}
    ${row3}
    <div class="contact">
      ${leftBlockHtml(inp)}
      ${statsWithIconsHtml(inp)}
      ${qrHtml}
    </div>
  </div>
</body></html>`;
}



function htmlCommon(inp: FlyerInput, qrDataUrl: string) {
  const [hero, ...rest] = inp.images.slice(0, 6);
  const heroHtml = hero ? `
    <div class="hero" style="aspect-ratio: 11 / 5;">
      <img src="${hero}" alt="Hero" />
      <div class="addr-overlay"><div class="addr-line">${safe(inp.address)}</div></div>
    </div>` : '';
  const collage = rest.length ? thumbsGridHtml(rest) : '';
  const qrHtml = `
    <div style="display:flex; align-items:center; gap:12px;">
      <div class="muted">Scan for property page</div>
      ${qrDataUrl ? `<img class=\"qr\" src=\"${qrDataUrl}\" alt=\"QR\" />` : ''}
    </div>`;
  return `
<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safe(inp.address)} - Flyer</title>
<style>${baseStyles()}</style></head><body>
  <div class="page">
    ${heroHtml}
    ${collage}
    <div class="contact">
      ${leftBlockHtml(inp)}
      <div class="stats">${[inp.beds && `${safe(inp.beds)} Beds`, inp.baths && `${safe(inp.baths)} Baths`, inp.sizeSqFt && `${safe(inp.sizeSqFt)} Sq Ft`].filter(Boolean).map((s) => `<div class=\"stat\">${s}</div>`).join('')}</div>
      ${qrHtml}
    </div>
  </div>
</body></html>`;
}


function htmlForVariant(inp: FlyerInput, qrDataUrl: string) {
  switch (inp.variant) {
    case 'f1':
      return htmlF1(inp, qrDataUrl);
    case 'f2':
      return htmlF2(inp, qrDataUrl);
    case 'f3':
      return htmlF3(inp, qrDataUrl);
    default:
      return htmlCommon(inp, qrDataUrl);
  }
}
async function getExecutablePath(): Promise<string> {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && process.env.PUPPETEER_EXECUTABLE_PATH.trim()) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.platform === 'win32') {
    const candidates = [
      'C\\Program Files\\Google\\Chrome\\Application\\chrome.exe'.replace(/\\/g, '\\\\'),
      'C\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'.replace(/\\/g, '\\\\'),
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
      'C\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'.replace(/\\/g, '\\\\'),
      'C\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'.replace(/\\/g, '\\\\'),
      path.join(process.env.LOCALAPPDATA || '', 'Microsoft\\Edge\\Application\\msedge.exe'),
    ].filter(Boolean) as string[];
    for (const p of candidates) {
      try { if (p && fs.existsSync(p)) return p; } catch {}
    }
    throw new Error('Chrome/Edge executable not found. Set PUPPETEER_EXECUTABLE_PATH env to your browser path.');
  }
  return await chromium.executablePath();
}


export async function renderFlyer(input: FlyerInput): Promise<{ pdf: Buffer; previewJpeg: Buffer; widthPx: number; heightPx: number }> {
  const widthPx = input.widthPx ?? 1275; // 8.5in * 150dpi
  const heightPx = input.heightPx ?? 1650; // 11in * 150dpi

  const executablePath = await getExecutablePath();
  const launchArgs = process.platform === 'win32' ? ['--no-sandbox'] : chromium.args;
  const browser = await puppeteer.launch({
    args: launchArgs,
    defaultViewport: { width: widthPx, height: heightPx },
    executablePath,
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: widthPx, height: heightPx, deviceScaleFactor: 1 });
    const qr = await buildQrDataUrl(input.qrUrl);
    const html = htmlForVariant(input, qr);
    await page.setContent(html, { waitUntil: ['networkidle0'] });

    // Create preview first (JPEG)
    const previewJpeg = await page.screenshot({ type: 'jpeg', quality: 85, optimizeForSpeed: true }) as Buffer;

    // Create PDF (Letter)
    const pdf = await page.pdf({ format: 'letter', printBackground: true }) as Buffer;

    return { pdf, previewJpeg, widthPx, heightPx };
  } finally {
    try { await browser.close(); } catch {}
  }
}

