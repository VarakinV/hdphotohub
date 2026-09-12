import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { auth } from '@/lib/auth/auth';
import { renderSocialPost } from '@/lib/social/generator';
import sharp from 'sharp';

async function samplePhoto(i: number): Promise<string> {
  const hues = ['12, 84%, 60%', '212, 70%, 50%', '150, 55%, 45%'];
  const h = hues[i % hues.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="hsl(${h})"/><text x="400" y="420" font-family="Arial" font-size="64" fill="rgba(255,255,255,0.85)" text-anchor="middle">PHOTO ${i + 1}</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function sampleHeadshot(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><circle cx="200" cy="200" r="200" fill="hsl(30, 40%, 60%)"/><circle cx="200" cy="150" r="70" fill="hsl(30, 30%, 40%)"/><path d="M60 400 Q200 260 340 400 Z" fill="hsl(30, 35%, 45%)"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function sampleLogo(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160"><rect x="20" y="20" width="360" height="120" rx="16" fill="#0f172a"/><text x="200" y="102" font-family="Arial" font-weight="800" font-size="52" fill="#ffffff" text-anchor="middle">ACME REALTY</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ variantKey: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { variantKey } = await params;
    const photos = await Promise.all([samplePhoto(0), samplePhoto(1), samplePhoto(2)]);
    const headshot = await sampleHeadshot();
    const logo = await sampleLogo();

    const { png } = await renderSocialPost({
      variantKey,
      label: undefined,
      images: photos,
      property: {
        address: '123 Maple Grove Ave',
        city: 'Ottawa',
        province: 'ON',
        postalCode: 'K1V 9S2',
        bedrooms: '4',
        bathrooms: '3',
        sqft: 2450,
        listPrice: 1249000,
      },
      realtor: {
        name: 'Sarah Mitchell',
        phone: '(613) 555-0123',
        email: 'sarah@acmerealty.com',
        companyName: 'ACME Realty',
        headshotUrl: headshot,
        logoUrl: logo,
      },
      qrUrl: 'https://example.com/property/demo',
    });

    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Preview failed', details: String(e?.message || e) }, { status: 500 });
  }
}
