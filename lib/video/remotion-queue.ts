import { prisma } from '@/lib/db/prisma';
import { RemotionProvider } from '@/lib/video/remotion-provider';

// How long a claimed-but-not-started row may sit in RENDERING before we assume
// the claimer crashed and re-queue it.
const STALE_CLAIM_MS = 2 * 60 * 1000;

export function remotionWebhookUrl(): string | undefined {
  const explicit = process.env.REMOTION_WEBHOOK_URL?.trim();
  const token = process.env.REMOTION_WEBHOOK_TOKEN?.trim();
  if (explicit) {
    const hasPath = /\/api\/integrations\/remotion(\?|$)/i.test(explicit);
    const base = hasPath ? explicit : `${explicit.replace(/\/$/, '')}/api/integrations/remotion`;
    return token ? `${base}${base.includes('?') ? '&' : '?'}token=${token}` : base;
  }
  const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  return base ? `${base}/api/integrations/remotion${token ? `?token=${token}` : ''}` : undefined;
}

export function remotionQueueConcurrency(): number {
  const n = parseInt(process.env.REMOTION_QUEUE_CONCURRENCY || '3', 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
}

// Unit/apartment designators that can prefix a street line in Google-formatted
// addresses ("Unit #3, 20729 Main Street SE, ...").
const UNIT_PREFIX = /^(unit|apt|apartment|suite|ste|bldg|building|lot|#)\b/i;

function streetLine(value: string | null | undefined): string {
  const v = String(value ?? '').trim();
  if (!v) return '';
  const segments = v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length === 1) return v;
  return segments.find((s) => !UNIT_PREFIX.test(s)) || segments[0] || '';
}

// Resolve the display address for reels/slideshows from an order. The admin
// overrides (propertyAddressOverride / propertyCityOverride / propertyPostalCodeOverride)
// always win when filled in; otherwise fall back to the Google-formatted address,
// then to the raw DB fields. The street line is normalized so unit/apartment
// prefixes ("Unit #3, ...") never appear as the street.
export function resolvePropertyAddress(order: any) {
  const street = order.propertyAddressOverride || order.propertyAddress || '';
  const city = order.propertyCityOverride || order.propertyCity || '';
  const postal = order.propertyPostalCodeOverride || order.propertyPostalCode || '';
  const province = order.propertyProvince || '';
  const formatted = order.propertyFormattedAddress;
  const hasOverrides = !!(
    order.propertyAddressOverride ||
    order.propertyCityOverride ||
    order.propertyPostalCodeOverride
  );
  const address = hasOverrides
    ? [street, [city, province].filter(Boolean).join(' '), postal]
        .filter(Boolean)
        .join(', ')
        .replace(/,\s*,/g, ', ')
        .trim()
    : formatted ||
      [street, [city, province].filter(Boolean).join(' '), postal]
        .filter(Boolean)
        .join(', ')
        .replace(/,\s*,/g, ', ')
        .trim();

  // Street line: the override wins verbatim; otherwise prefer the street segment
  // of the Google-formatted address, falling back to the raw street field.
  const resolvedStreet = hasOverrides ? street : streetLine(formatted) || streetLine(street);

  return { street: resolvedStreet, city, postalCode: postal, province, address };
}

export function buildRenderMeta(order: any, sources: { url: string }[], musicTrackUrl?: string) {
  const { street: resolvedStreet, city, postalCode: postal, province, address } =
    resolvePropertyAddress(order);

  const rinfo = order.realtor || {};
  return {
    orderId: order.id,
    address,
    street: resolvedStreet,
    city,
    postalCode: postal,
    province,
    bedrooms: order.bedrooms || 0,
    bathrooms: order.bathrooms || 0,
    sqft: order.propertySize || 0,
    realtorPhone: rinfo?.phone || '',
    realtorHeadshot: rinfo?.headshot || '',
    realtorLogo: rinfo?.companyLogo || '',
    realtorName: `${rinfo?.firstName || ''} ${rinfo?.lastName || ''}`.trim(),
    musicTrackUrl,
  };
}

async function startSingleReel(reel: any) {
  const order = await prisma.order.findUnique({
    where: { id: reel.orderId },
    include: {
      realtor: { select: { id: true, firstName: true, lastName: true, phone: true, headshot: true, companyLogo: true } },
    },
  });
  if (!order) throw new Error(`Order not found: ${reel.orderId}`);

  const sources = await prisma.orderReelSourceImage.findMany({
    where: { orderId: reel.orderId },
    orderBy: { sortOrder: 'asc' },
  });
  if (sources.length < 3) throw new Error('Need at least 3 reel images');

  let musicTrackUrl: string | undefined;
  if (reel.musicTrackId) {
    const track = await prisma.videoMusicTrack.findUnique({
      where: { id: reel.musicTrackId },
      select: { fileUrl: true },
    });
    musicTrackUrl = track?.fileUrl || undefined;
  }

  const provider = new RemotionProvider();
  const webhook = remotionWebhookUrl() || '';
  const meta = buildRenderMeta(order, sources, musicTrackUrl);
  const { renderId } = await provider.render({
    images: sources.map((s) => s.url),
    variantKey: reel.variantKey,
    webhookUrl: webhook,
    meta: { ...meta, reelId: reel.id },
  });

  await prisma.orderReel.update({
    where: { id: reel.id },
    data: { renderId, status: 'RENDERING', error: null },
  });
}

/**
 * Starts up to `limit` QUEUED Remotion reels (oldest first, optionally scoped to
 * one order). Rows are claimed atomically (QUEUED -> RENDERING) so concurrent
 * queue runners (generate, webhook chain, sync, cron) never double-start a render.
 * Rows claimed but never started (no renderId after 2 min) are re-queued.
 */
export async function startRemotionBatch(options?: { limit?: number; orderId?: string }): Promise<{ started: number; failed: number }> {
  const limit = Math.max(1, options?.limit ?? remotionQueueConcurrency());
  const orderId = options?.orderId;

  // Recover stale claims from a crashed runner.
  await prisma.orderReel.updateMany({
    where: {
      provider: 'remotion',
      status: 'RENDERING',
      renderId: 'pending',
      updatedAt: { lt: new Date(Date.now() - STALE_CLAIM_MS) },
      ...(orderId ? { orderId } : {}),
    },
    data: { status: 'QUEUED' },
  });

  const candidates = await prisma.orderReel.findMany({
    where: {
      provider: 'remotion',
      status: 'QUEUED',
      ...(orderId ? { orderId } : {}),
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true },
  });
  if (candidates.length === 0) return { started: 0, failed: 0 };

  const claimed = await prisma.orderReel.updateMany({
    where: { id: { in: candidates.map((c) => c.id) }, status: 'QUEUED' },
    data: { status: 'RENDERING' },
  });
  if (claimed.count === 0) return { started: 0, failed: 0 };

  const rows = await prisma.orderReel.findMany({
    where: { id: { in: candidates.slice(0, claimed.count).map((c) => c.id) } },
  });

  let started = 0;
  let failed = 0;
  for (const reel of rows) {
    try {
      await startSingleReel(reel);
      started += 1;
    } catch (e: any) {
      failed += 1;
      console.error('Remotion queue: failed to start reel', { id: reel.id, variantKey: reel.variantKey, e });
      await prisma.orderReel.update({
        where: { id: reel.id },
        data: { status: 'FAILED', error: String(e?.message || e) },
      });
    }
  }
  return { started, failed };
}
