import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { DeliveryPageClient } from '@/components/delivery/DeliveryPageClient';
import type { DeliveryPageData } from '@/components/delivery/types';

async function getOrder(id: string) {
  const order = await prisma.order.findFirst({
    where: { id, status: 'PUBLISHED' },
    include: {
      realtor: true,
      photos: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      },
      videos: true,
      reels: true,
      socialPosts: true,
      floorPlans: true,
      attachments: true,
      embeds: true,
      propertyPages: true,
      flyers: true,
      aiReels: {
        where: { j2vStatus: 'COMPLETE' },
        select: {
          id: true,
          finalUrl: true,
          thumbnail: true,
          sourceImageUrl: true,
          width: true,
          height: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      qrAssignments: {
        where: { unassignedAt: null },
        include: {
          qrCode: {
            include: {
              printables: {
                where: { status: 'COMPLETE' },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      },
    },
  });
  return order;
}

const REEL_ORDER_KEYS = [
  'v1-9x16',
  'v2-9x16',
  'v3-9x16',
  'v4-9x16',
  'v5-9x16',
  'v6-9x16',
  'v7-9x16',
  'v8-9x16',
  'v9-9x16',
  'v10-9x16',
  'v11-9x16',
  'v12-9x16',
  'v13-9x16',
  'v14-9x16',
];

const REEL_LABELS: Record<string, string> = {
  'v1-9x16': 'Coming Soon',
  'v2-9x16': 'For Sale',
  'v3-9x16': 'For Sale',
  'v4-9x16': 'Just Listed',
  'v5-9x16': 'For Sale',
  'v6-9x16': 'Coming Soon',
  'v7-9x16': 'For Sale',
  'v8-9x16': 'New Listing',
  'v9-9x16': 'For Sale',
  'v10-9x16': 'Just Listed',
  'v11-9x16': 'For Sale',
  'v12-9x16': 'For Sale',
  'v13-9x16': 'For Sale',
  'v14-9x16': 'For Sale',
  'v15-9x16': 'New Listing',
  'v16-9x16': 'For Sale',
  'v17-9x16': 'New Listing',
};

const SLIDESHOW_ORDER_KEYS = ['h1-16x9', 'h2-16x9', 'h3-16x9', 'h4-16x9'];

const SLIDESHOW_LABELS: Record<string, string> = {
  'h1-16x9': 'Property Showcase',
  'h2-16x9': 'Property Showcase',
  'h3-16x9': 'Property Showcase',
  'h4-16x9': 'Just Listed',
};

const QR_LABELS: Record<string, string> = {
  'bare-qr': 'Bare QR Code',
  'rider-scan-info': 'Sign Rider - Scan for Info',
  'rider-scan-tour-price': 'Sign Rider - Tour & Price',
  'rider-scan-see-inside': 'Sign Rider - See Inside',
  'decal-scan-info': 'Decal - Scan for Info',
  'decal-scan-tour-price': 'Decal - Tour & Price',
  'decal-scan-see-inside': 'Decal - See Inside',
};

const WEBSITE_NAMES: Record<number, string> = {
  6: 'Nivo',
  5: 'Lin',
  4: 'Juno',
  3: 'Axis',
  2: 'Nox',
  1: 'Sera',
};

function sortKeyIndex(keys: string[], key: string) {
  const i = keys.indexOf((key || '').toLowerCase());
  return i >= 0 ? i : 999;
}

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const socialTemplates = await prisma.socialPostTemplate.findMany({
    select: { variantKey: true, name: true, label: true, sortOrder: true },
  });
  const socialTemplateMeta = new Map(socialTemplates.map((t) => [t.variantKey, t]));
  const SOCIAL_CATEGORY_ORDER = [
    'coming-soon',
    'just-listed',
    'new-listing',
    'for-sale',
    'sold',
  ];
  const socialCategoryRank = (variantKey: string) => {
    const idx = SOCIAL_CATEGORY_ORDER.findIndex(
      (prefix) => variantKey === prefix || variantKey.startsWith(`${prefix}-`)
    );
    return idx === -1 ? SOCIAL_CATEGORY_ORDER.length : idx;
  };
  const socialCollator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  const socialPostsSorted = (order.socialPosts || [])
    .filter((p) => p.status === 'COMPLETE' && p.url)
    .sort((a, b) => {
      const catCmp = socialCategoryRank(a.variantKey) - socialCategoryRank(b.variantKey);
      if (catCmp !== 0) return catCmp;
      const metaA = socialTemplateMeta.get(a.variantKey);
      const metaB = socialTemplateMeta.get(b.variantKey);
      const labelCmp = socialCollator.compare(metaA?.label ?? '', metaB?.label ?? '');
      if (labelCmp !== 0) return labelCmp;
      const sortCmp =
        (metaA?.sortOrder ?? Number.MAX_SAFE_INTEGER) -
        (metaB?.sortOrder ?? Number.MAX_SAFE_INTEGER);
      if (sortCmp !== 0) return sortCmp;
      return a.variantKey < b.variantKey ? -1 : a.variantKey > b.variantKey ? 1 : 0;
    });

  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
  const proto =
    hdrs.get('x-forwarded-proto') ??
    (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : '');
  const publicUrl = `${baseUrl}/delivery/${order.id}`;
  const heroUrl: string | null = order.photos[0]?.url ?? order.photos[0]?.urlMls ?? null;

  const addressLine = (
    order.propertyAddressOverride ||
    order.propertyAddress ||
    order.propertyFormattedAddress ||
    ''
  ).split(',')[0];

  const cityLine = [
    order.propertyCityOverride || order.propertyCity,
    order.propertyProvince,
  ]
    .filter(Boolean)
    .join(', ');

  const completeReels = (order.reels || []).filter((r) => r.status === 'COMPLETE' && r.url);

  const data: DeliveryPageData = {
    orderId: order.id,
    publicUrl,
    addressLine,
    cityLine,
    shootDate: null,
    heroUrl,
    realtor: {
      firstName: order.realtor.firstName,
      lastName: order.realtor.lastName,
      email: order.realtor.email,
      phone: order.realtor.phone,
      headshot: order.realtor.headshot,
    },
    photos: order.photos.map((p) => ({
      id: p.id,
      url: p.url,
      urlMls: p.urlMls,
      filename: p.filename,
    })),
    videos: order.videos.map((v) => ({
      id: v.id,
      url: v.url,
      filename: v.filename,
    })),
    reels: completeReels
      .filter((r) => (r.variantKey || '').toLowerCase().startsWith('v'))
      .slice()
      .sort((a, b) => sortKeyIndex(REEL_ORDER_KEYS, a.variantKey) - sortKeyIndex(REEL_ORDER_KEYS, b.variantKey))
      .map((r) => ({
        id: r.id,
        url: r.url as string,
        thumbnail: r.thumbnail,
        variantKey: r.variantKey,
        width: r.width,
        height: r.height,
        label: REEL_LABELS[(r.variantKey || '').toLowerCase()] || (r.variantKey || '').toUpperCase(),
      })),
    aiReels: (order.aiReels || [])
      .filter((r) => r.finalUrl)
      .map((r, i, arr) => ({
        id: r.id,
        finalUrl: r.finalUrl as string,
        thumbnail: r.thumbnail,
        width: r.width,
        height: r.height,
        label: arr.length > 1 ? `AI Twilight Reel ${i + 1}` : 'AI Twilight Reel',
      })),
    slideshows: completeReels
      .filter((r) => (r.variantKey || '').toLowerCase().startsWith('h'))
      .slice()
      .sort(
        (a, b) =>
          sortKeyIndex(SLIDESHOW_ORDER_KEYS, a.variantKey) -
          sortKeyIndex(SLIDESHOW_ORDER_KEYS, b.variantKey)
      )
      .map((r) => ({
        id: r.id,
        url: r.url as string,
        thumbnail: r.thumbnail,
        variantKey: r.variantKey,
        width: r.width,
        height: r.height,
        label:
          SLIDESHOW_LABELS[(r.variantKey || '').toLowerCase()] ||
          (r.variantKey || '').toUpperCase(),
      })),
    socialPosts: socialPostsSorted.map((p) => ({
      id: p.id,
      url: p.url as string,
      variantKey: p.variantKey,
      caption: socialTemplateMeta.get(p.variantKey)?.name || p.variantKey.replace(/-/g, ' '),
    })),
    floorPlans: order.floorPlans.map((f) => ({
      id: f.id,
      url: f.url,
      filename: f.filename,
    })),
    attachments: order.attachments.map((a) => ({
      id: a.id,
      url: a.url,
      filename: a.filename,
    })),
    embeds: order.embeds.map((e) => ({
      id: e.id,
      title: e.title,
      embedUrl: e.embedUrl,
    })),
    flyers: (order.flyers || [])
      .filter((f) => f.status === 'COMPLETE' && f.url)
      .map((f) => ({
        id: f.id,
        url: f.url as string,
        previewUrl: f.previewUrl,
        variantKey: f.variantKey,
      })),
    websites: [6, 5, 4, 3, 2, 1].map((v) => ({
      variant: v,
      name: WEBSITE_NAMES[v],
      url: `${baseUrl}/property/${order.id}/v${v}`,
      previewSrc: `/property/${order.id}/v${v}`,
    })),
    qrPrintables: order.qrAssignments.flatMap((a) =>
      a.qrCode.printables.map((p) => ({
        id: p.id,
        variantKey: p.variantKey,
        label: QR_LABELS[p.variantKey] || p.variantKey,
        displayId: a.qrCode.displayId,
        pngUrl: p.pngUrl,
        pdfUrl: p.pdfUrl,
      }))
    ),
  };

  return <DeliveryPageClient data={data} />;
}
