import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { remotionQueueConcurrency, startRemotionBatch } from '@/lib/video/remotion-queue';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { realtor: { select: { id: true, firstName: true, lastName: true, phone: true, headshot: true, companyLogo: true } } },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) {
      if (!realtorId || order.realtorId !== realtorId) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Sources 3..6
    const sources = await prisma.orderReelSourceImage.findMany({ where: { orderId: id }, orderBy: { sortOrder: 'asc' } });
    if (sources.length < 3) return NextResponse.json({ error: 'At least 3 images required' }, { status: 400 });
    if (sources.length > 6) return NextResponse.json({ error: 'Max 6 images allowed' }, { status: 400 });

    // Required fields
    const missing: string[] = [];
    const r = order.realtor as any;
    if (!r?.headshot) missing.push('Realtor headshot');
    if (!r?.companyLogo) missing.push('Brokerage logo');
    if (!r?.firstName || !r?.lastName) missing.push('Realtor name');
    if (!r?.phone) missing.push('Realtor phone');
    if (!order.bedrooms) missing.push('Bedrooms');
    if (!order.bathrooms) missing.push('Bathrooms');
    if (!order.propertyAddress && !order.propertyFormattedAddress) missing.push('Property address');
    if (missing.length) return NextResponse.json({ error: 'Missing fields', missing }, { status: 400 });

    // Guard: cap Remotion reels per order (J2V reels are separate and don't
    // consume this budget — both providers are meant to coexist).
    const existingCount = await prisma.orderReel.count({ where: { orderId: id, provider: 'remotion' } });
    const MAX_REELS = 15;

    // Optional body: batch override for music across all variants.
    // If omitted, each variant uses its template's defaultMusicTrackId.
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // no body
    }
    const hasOverride = Object.prototype.hasOwnProperty.call(body, 'musicTrackId');
    const overrideTrackId = typeof body?.musicTrackId === 'string' ? body.musicTrackId.trim() : '';

    // Only variants whose template is ACTIVE (fallback to env list).
    // Also capture each template's default music track.
    let activeTemplates: { variantKey: string; defaultMusicTrackId: string | null }[] = [];
    try {
      activeTemplates = await prisma.videoTemplate.findMany({
        where: { status: 'active', provider: 'remotion' },
        select: { variantKey: true, defaultMusicTrackId: true },
      });
    } catch {
      // VideoTemplate table not available yet
    }
    let activeVariants = activeTemplates.map((t) => t.variantKey).filter(Boolean);
    if (activeVariants.length === 0) {
      const envList = (process.env.REMOTION_VARIANTS || 'v1-9x16').split(',').map((s) => s.trim()).filter(Boolean);
      if (envList.length > 0) activeVariants = envList;
    }
    if (activeVariants.length === 0) {
      return NextResponse.json({ error: 'No active Remotion templates' }, { status: 400 });
    }

    // Resolve music per variant: batch override wins, otherwise template default.
    const templateDefault = new Map(activeTemplates.map((t) => [t.variantKey, t.defaultMusicTrackId]));
    const variants = [...new Set(activeVariants)];
    const perVariantMusic: Record<string, string | null> = {};
    for (const v of variants) {
      const trackId = hasOverride ? overrideTrackId : (templateDefault.get(v) ?? '');
      perVariantMusic[v] = trackId || null;
    }
    const neededIds = [...new Set(Object.values(perVariantMusic).filter(Boolean))] as string[];
    let trackMap = new Map<string, { id: string; fileUrl: string }>();
    if (neededIds.length > 0) {
      try {
        const tracks = await prisma.videoMusicTrack.findMany({ where: { id: { in: neededIds } } });
        trackMap = new Map(tracks.map((t) => [t.id, { id: t.id, fileUrl: t.fileUrl }]));
      } catch {
        // VideoMusicTrack table not available yet
      }
      for (const id of neededIds) {
        if (!trackMap.has(id)) {
          return NextResponse.json({ error: 'Music track not found', trackId: id }, { status: 400 });
        }
      }
    }

    // Never create duplicates: only enqueue variants with no existing Remotion row.
    const existingVariants = await prisma.orderReel.findMany({
      where: { orderId: id, provider: 'remotion' },
      select: { variantKey: true },
    });
    const existingSet = new Set(existingVariants.map((e) => e.variantKey));
    const toCreate = variants.filter((v) => !existingSet.has(v));

    if (toCreate.length === 0) {
      return NextResponse.json({ ok: true, created: [], started: 0, failed: 0, alreadyExists: true });
    }

    // Never silently drop variants — fail loudly so the UI can tell the user.
    if (toCreate.length > MAX_REELS - existingCount) {
      return NextResponse.json({
        error: `Cannot generate all ${toCreate.length} missing variants: order already has ${existingCount} Remotion reel(s) (max ${MAX_REELS}). Delete some reels first.`,
        created: existingCount,
      }, { status: 400 });
    }

    const created = await prisma.$transaction(toCreate.map((v) => {
      const trackId = perVariantMusic[v] || undefined;
      return prisma.orderReel.create({
        data: {
          orderId: id,
          variantKey: v,
          provider: 'remotion',
          renderId: 'pending',
          status: 'QUEUED' as const,
          ...(trackId ? { musicTrackId: trackId } : {}),
        },
      });
    }));

    // Kick off the queue. Rows were created QUEUED; start the first batch inline
    // (bounded by REMOTION_QUEUE_CONCURRENCY) and let the webhook chain + sync
    // route start the rest. This keeps the HTTP request short and avoids firing
    // 11 renders at once (which could stall on Lambda concurrency).
    const { started, failed } = await startRemotionBatch({
      limit: Math.min(created.length, remotionQueueConcurrency()),
    });

    return NextResponse.json({ ok: true, created: created.map((c) => c.id), started, failed });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to queue Remotion reels' }, { status: 500 });
  }
}
