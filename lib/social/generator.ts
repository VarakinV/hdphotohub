import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import QRCode from 'qrcode';
import { loadFonts } from './fonts';
import { renderTemplate } from './templates';
import { POST_HEIGHT, POST_WIDTH, type SocialPostInput } from './types';

async function fetchToDataUrl(url: string, opts?: { maxW?: number; maxH?: number; quality?: number }): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const buf = Buffer.from(await res.arrayBuffer());
    const maxW = opts?.maxW ?? 1080;
    const maxH = opts?.maxH ?? 1080;
    const quality = opts?.quality ?? 82;
    const out = await sharp(buf)
      .rotate()
      .resize({ width: maxW, height: maxH, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, chromaSubsampling: '4:2:0', mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${out.toString('base64')}`;
  } catch {
    return '';
  }
}

async function buildQrDataUrl(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, { margin: 0 });
  } catch {
    return '';
  }
}

export type SocialPostRenderResult = {
  png: Buffer;
  width: number;
  height: number;
};

export async function renderSocialPost(input: SocialPostInput): Promise<SocialPostRenderResult> {
  const images = await Promise.all(
    input.images.slice(0, 6).map((u) => fetchToDataUrl(u, { maxW: 1080, maxH: 1080, quality: 82 }))
  );
  const headshotUrl = input.realtor.headshotUrl
    ? await fetchToDataUrl(input.realtor.headshotUrl, { maxW: 400, maxH: 400, quality: 82 })
    : '';
  const logoUrl = input.realtor.logoUrl
    ? await fetchToDataUrl(input.realtor.logoUrl, { maxW: 800, maxH: 400, quality: 82 })
    : '';
  const qrDataUrl = input.qrUrl ? await buildQrDataUrl(input.qrUrl) : undefined;

  const el = renderTemplate({
    ...input,
    qrDataUrl: input.qrDataUrl || qrDataUrl,
    images,
    realtor: { ...input.realtor, headshotUrl, logoUrl },
  });

  const svg = await satori(el, {
    width: POST_WIDTH,
    height: POST_HEIGHT,
    fonts: loadFonts(),
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: POST_WIDTH },
    background: '#ffffff',
  });
  const raw = resvg.render().asPng();

  const png = await sharp(raw)
    .resize(POST_WIDTH, POST_HEIGHT, { fit: 'fill' })
    .png({ quality: 95, compressionLevel: 9 })
    .toBuffer();

  return { png, width: POST_WIDTH, height: POST_HEIGHT };
}
