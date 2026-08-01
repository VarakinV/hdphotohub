import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { uploadBufferToS3WithPath } from '@/lib/utils/s3';
import QRCode from 'qrcode';

const BRAND = '#000000';
const RIDER_BG = '#ca4153';
const RIDER_TEXT = '#ffffff';

export type PrintVariant =
  | 'bare-qr'
  | 'rider-scan-info'
  | 'rider-scan-tour-price'
  | 'rider-scan-see-inside'
  | 'decal-scan-info'
  | 'decal-scan-tour-price'
  | 'decal-scan-see-inside';

interface PrintDimensions {
  width: number;
  height: number;
  qrSize: number;
  fontSize: number;
}

function getVariantDimensions(variant: PrintVariant): PrintDimensions {
  switch (variant) {
    case 'rider-scan-info':
    case 'rider-scan-tour-price':
    case 'rider-scan-see-inside':
      return { width: 24 * 96, height: 6 * 96, qrSize: 4 * 96, fontSize: 2 * 96 };
    case 'decal-scan-info':
    case 'decal-scan-tour-price':
    case 'decal-scan-see-inside':
      return { width: 4 * 96, height: 4 * 96, qrSize: 2.5 * 96, fontSize: 24 };
    case 'bare-qr':
    default:
      return { width: 4 * 96, height: 4 * 96, qrSize: 2.5 * 96, fontSize: 0 };
  }
}

function getVariantCopy(variant: PrintVariant): string | null {
  switch (variant) {
    case 'rider-scan-info':
    case 'decal-scan-info':
      return 'Scan me for more info';
    case 'rider-scan-tour-price':
      return 'Scan for photos<br>Virtual tour & price';
    case 'decal-scan-tour-price':
      return 'Scan for photos<br>Virtual tour & price';
    case 'rider-scan-see-inside':
    case 'decal-scan-see-inside':
      return 'See inside — scan me';
    case 'bare-qr':
    default:
      return null;
  }
}

async function getExecutablePath(): Promise<string> {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && process.env.PUPPETEER_EXECUTABLE_PATH.trim()) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
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
      'Chrome/Edge executable not found. Set PUPPETEER_EXECUTABLE_PATH env to your browser path.'
    );
  }
  return await chromium.executablePath();
}

async function generateQrPng(qrUrl: string, size: number, darkColor: string = BRAND): Promise<string> {
  const dataUrl = await QRCode.toDataURL(qrUrl, {
    width: size,
    margin: 2,
    color: {
      dark: darkColor,
      light: '#ffffff',
    },
  } as any);
  return dataUrl;
}

async function generatePrintHtml(
  qrUrl: string,
  displayId: string,
  variant: PrintVariant
): Promise<string> {
  const dims = getVariantDimensions(variant);
  const copy = getVariantCopy(variant);
  const isRider = variant.startsWith('rider-');

  if (isRider) {
    const qrPngDataUrl = await generateQrPng(qrUrl, dims.qrSize, BRAND);
    
    const copyHtml = copy
      ? `<div style="font-family: 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif; font-size: ${dims.fontSize}px; font-weight: 700; color: ${RIDER_TEXT}; line-height: 1.1; white-space: nowrap;">${copy}</div>`
      : '';

    const displayIdHtml =
      `<div style="font-family: 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif; font-size: ${Math.max(dims.fontSize * 0.4, 24)}px; color: ${RIDER_TEXT}; margin-top: 10px; text-align: center;">${displayId}</div>`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: ${dims.width}px;
            height: ${dims.height}px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${RIDER_BG};
            overflow: hidden;
          }
          .container {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            height: 100%;
            padding: 40px 60px;
          }
          .text-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding-right: 40px;
          }
          .qr-section {
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="text-section">
            ${copyHtml}
          </div>
          <div class="qr-section">
            <img src="${qrPngDataUrl}" width="${dims.qrSize}" height="${dims.qrSize}" alt="QR Code" />
            ${displayIdHtml}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  const qrPngDataUrl = await generateQrPng(qrUrl, dims.qrSize);
  const isDecal = variant.startsWith('decal-');
  const containerPadding = isDecal ? 10 : 20;
  const copyMarginTop = isDecal ? 8 : 20;
  const displayIdMarginTop = isDecal ? 4 : 10;

  const copyHtml = copy
    ? `<div style="font-family: Arial, sans-serif; font-size: ${dims.fontSize}px; font-weight: bold; color: ${BRAND}; text-align: center; margin-top: ${copyMarginTop}px;">${copy}</div>`
    : '';

  const displayIdHtml =
    variant !== 'bare-qr'
      ? `<div style="font-family: Arial, sans-serif; font-size: ${Math.max(dims.fontSize * 0.6, 16)}px; color: #666; text-align: center; margin-top: ${displayIdMarginTop}px;">${displayId}</div>`
      : `<div style="font-family: Arial, sans-serif; font-size: 24px; color: #666; text-align: center; margin-top: ${displayIdMarginTop}px;">${displayId}</div>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: ${dims.width}px;
          height: ${dims.height}px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: white;
          overflow: hidden;
        }
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: ${containerPadding}px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img src="${qrPngDataUrl}" width="${dims.qrSize}" height="${dims.qrSize}" alt="QR Code" />
        ${copyHtml}
        ${displayIdHtml}
      </div>
    </body>
    </html>
  `;
}

async function uploadToS3(
  buffer: Buffer,
  displayId: string,
  filename: string,
  contentType: string
): Promise<string> {
  const { fileUrl } = await uploadBufferToS3WithPath(
    `qr-printables/${displayId}`,
    filename,
    buffer,
    contentType
  );
  return fileUrl;
}

export async function generateQrPrintArtifacts(
  qrUrl: string,
  displayId: string,
  variant: PrintVariant
): Promise<{ pngUrl: string; pdfUrl: string }> {
  const exec = await getExecutablePath();
  const dims = getVariantDimensions(variant);
  const html = await generatePrintHtml(qrUrl, displayId, variant);

  const launchArgs = process.platform === 'win32' ? ['--no-sandbox'] : chromium.args;
  const browser = await puppeteer.launch({
    args: launchArgs,
    executablePath: exec,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: dims.width,
      height: dims.height,
      deviceScaleFactor: 2,
    });
    await page.setContent(html, { waitUntil: ['load'] });
    
    // Wait for fonts to load (important for Google Fonts)
    await page.evaluate(() => document.fonts.ready);

    const body = await page.$('body');
    if (!body) {
      throw new Error('Body element not found');
    }

    const pngData = await body.screenshot({ type: 'png' });
    const pngBuffer = Buffer.from(pngData);
    const pngUrl = await uploadToS3(pngBuffer, displayId, `qr-${displayId}-${variant}.png`, 'image/png');

    const pdfData = await page.pdf({
      width: `${dims.width}px`,
      height: `${dims.height}px`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    const pdfBuffer = Buffer.from(pdfData);
    const pdfUrl = await uploadToS3(pdfBuffer, displayId, `qr-${displayId}-${variant}.pdf`, 'application/pdf');

    return { pngUrl, pdfUrl };
  } finally {
    try {
      await browser.close();
    } catch {
      // ignore
    }
  }
}
