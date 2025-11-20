import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

export type QrVariant = 'professional' | 'modern' | 'social' | 'custom';

export type StyleOverrides = {
  dotsType?: string;
  cornersSquareType?: string;
  cornersDotType?: string;
  darkColor?: string;
  lightColor?: string;
};

const BRAND = '#ca4153';

type VariantConfig = {
  dark: string;
  light: string;
  size: number;
};

function getVariantConfig(variant: QrVariant): VariantConfig {
  switch (variant) {
    case 'modern':
      return { dark: '#111827', light: '#f9fafb', size: 928 };
    case 'social':
      return { dark: '#000000', light: '#ffffff', size: 928 };
    case 'custom':
      return { dark: '#111827', light: '#ffffff', size: 928 };
    case 'professional':
    default:
      return { dark: BRAND, light: '#ffffff', size: 928 };
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
      try {
        if (p && fs.existsSync(p)) return p;
      } catch {
        // ignore
      }
    }
    throw new Error(
      'Chrome/Edge executable not found. Set PUPPETEER_EXECUTABLE_PATH env to your browser path.',
    );
  }
  return await chromium.executablePath();
}

export async function generateQrPdfFromSvg(svgMarkup: string): Promise<Buffer> {
  const executablePath = await getExecutablePath();
  const side = 512;

  const launchArgs = process.platform === 'win32' ? ['--no-sandbox'] : chromium.args;
  const browser = await puppeteer.launch({
    args: launchArgs,
    defaultViewport: { width: side + 64, height: side + 64 },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: side + 64, height: side + 64, deviceScaleFactor: 2 });
    const html = `<!doctype html><html><head><meta charset="utf-8" /><style>
      body { margin: 0; padding: 0; height: 100vh; display: flex; align-items: center; justify-content: center; background: #ffffff; }
      .frame { padding: 16px; border-radius: 16px; box-shadow: 0 10px 30px rgba(15,23,42,0.12); }
    </style></head><body><div class="frame">${svgMarkup}</div></body></html>`;

    await page.setContent(html, { waitUntil: ['networkidle0'] });
    const printablePx = 96 * 7.5; // letter portrait with 0.5in margins -> 7.5in * 96dpi
    const containerWidth = side + 32; // QR size plus 16px padding on each side
    const pdfScale = Math.min(1, printablePx / containerWidth);
    const pdf = (await page.pdf({
      format: 'letter',
      printBackground: true,
      margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
      scale: pdfScale,
    })) as Buffer;
    return pdf;
  } finally {
    try {
      await browser.close();
    } catch {
      // ignore
    }
  }
}

async function loadDefaultLogoDataUrl(): Promise<string | null> {
  try {
    const p = path.join(process.cwd(), 'public', 'Map-Pin-Logo.svg');
    const buf = await fs.promises.readFile(p);
    const b64 = buf.toString('base64');
    return `data:image/svg+xml;base64,${b64}`;
  } catch {
    return null;
  }
}

function htmlForQrStyling(opts: { data: string; variant: QrVariant; size: number; logoDataUrl?: string | null; style?: StyleOverrides; }): string {
  const { data, variant, size, logoDataUrl, style } = opts;
  // Map variant to shapes/colors
  const themes: Record<QrVariant, any> = {
    professional: {
      dots: { color: BRAND, type: 'square' },
      bg: '#ffffff',
      cornersSquare: { color: BRAND, type: 'extra-rounded' },
      cornersDot: { color: BRAND, type: 'square' },
    },
    modern: {
      dots: { color: '#111827', type: 'dots' },
      bg: '#f9fafb',
      cornersSquare: { color: '#111827', type: 'extra-rounded' },
      cornersDot: { color: '#111827', type: 'dot' },
    },
    social: {
      dots: { color: '#000000', type: 'rounded' },
      bg: '#ffffff',
      cornersSquare: { color: '#000000', type: 'square' },
      cornersDot: { color: '#000000', type: 'dot' },
    },
    custom: {
      dots: { color: '#111827', type: 'square' },
      bg: '#ffffff',
      cornersSquare: { color: '#111827', type: 'square' },
      cornersDot: { color: '#111827', type: 'dot' },
    },
  };
  const base = themes[variant];
  // Apply optional overrides
  const t = {
    dots: { color: style?.darkColor || base.dots.color, type: style?.dotsType || base.dots.type },
    bg: style?.lightColor || base.bg,
    cornersSquare: { color: style?.darkColor || base.cornersSquare.color, type: style?.cornersSquareType || base.cornersSquare.type },
    cornersDot: { color: style?.darkColor || base.cornersDot.color, type: style?.cornersDotType || base.cornersDot.type },
  } as any;
  const logo = logoDataUrl ? `'${logoDataUrl}'` : 'null';
  return `<!doctype html><html><head><meta charset="utf-8" />
    <style>
      html,body{margin:0;padding:0;background:#fff}
      #wrap{display:flex;align-items:center;justify-content:center;min-height:100vh}
      #container{padding:16px;background:${t.bg};border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,0.08)}
    </style>
    <script src="https://unpkg.com/qr-code-styling@1.6.0-rc.1/lib/qr-code-styling.js"></script>
  </head><body>
    <div id="wrap"><div id="container"></div></div>
    <script>
      (async function(){
        const QR = window.QRCodeStyling || window.QrCodeStyling;
        if(!QR){ throw new Error('qr-code-styling not available'); }
        const qr = new QR({
          width: ${size}, height: ${size}, type: 'svg', data: ${JSON.stringify(data)},
          image: ${logo},
          qrOptions: { errorCorrectionLevel: 'H' },
          dotsOptions: { color: '${t.dots.color}', type: '${t.dots.type}' },
          backgroundOptions: { color: '${t.bg}' },
          cornersSquareOptions: { color: '${t.cornersSquare.color}', type: '${t.cornersSquare.type}' },
          cornersDotOptions: { color: '${t.cornersDot.color}', type: '${t.cornersDot.type}' },
          imageOptions: { margin: 8, crossOrigin: 'anonymous', hideBackgroundDots: true, imageSize: 0.22 }
        });
        const el = document.getElementById('container');
        qr.append(el);
        // wait for svg to appear
        const delay = (ms) => new Promise(r=>setTimeout(r,ms));
        for (let i=0;i<50;i++){ if(el.querySelector('svg')) break; await delay(50); }
      })();
    </script>
  </body></html>`;
}

export async function generateStyledQrAssets(
  data: string,
  variant: QrVariant,
  opts?: { style?: StyleOverrides; logoDataUrl?: string | null }
): Promise<{ svg: string; png: Buffer; pdf: Buffer; }>{
  const exec = await getExecutablePath();
  const { size } = getVariantConfig(variant);
  const logo = opts?.logoDataUrl ?? (await loadDefaultLogoDataUrl());
  const html = htmlForQrStyling({ data, variant, size, logoDataUrl: logo || undefined, style: opts?.style });

  const launchArgs = process.platform === 'win32' ? ['--no-sandbox'] : chromium.args;
  const browser = await puppeteer.launch({ args: launchArgs, executablePath: exec, headless: true });
  try{
    const page = await browser.newPage();
    await page.setViewport({ width: size + 64, height: size + 64, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: ['networkidle0'] });
    // get svg markup
    const svg = await page.$eval('#container', (el) => {
      const s = el.querySelector('svg');
      return s ? (s as any).outerHTML : '';
    });
    // PNG screenshot of the container
    const el = await page.$('#container');
    const png = el ? ((await el.screenshot({ type: 'png' })) as Buffer) : Buffer.from([]);
    // PDF of the whole page (letter) to maintain consistent output
    const printablePx2 = 96 * 7.5; // letter portrait with 0.5in margins -> 7.5in * 96dpi
    const containerWidth2 = size + 32; // QR size plus padding
    const pdfScale2 = Math.min(1, printablePx2 / containerWidth2);
    const pdf = (await page.pdf({
      format: 'letter',
      printBackground: true,
      margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
      scale: pdfScale2,
    })) as Buffer;
    return { svg, png, pdf };
  } finally {
    try{ await browser.close(); } catch {}
  }
}

