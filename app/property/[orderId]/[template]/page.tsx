import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import { headers } from 'next/headers';
import PropertyTemplateV1 from '@/components/property/templates/PropertyTemplateV1';
import PropertyTemplateV2 from '@/components/property/templates/PropertyTemplateV2';
import PropertyTemplateV3 from '@/components/property/templates/PropertyTemplateV3';

async function getOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      realtor: true,
      photos: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      },
      videos: true,
      floorPlans: true,
      attachments: true,
      embeds: true,
      propertyPages: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderId: string; template: string }>;
}): Promise<Metadata> {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) return {};
  const title = order.propertyFormattedAddress || order.propertyAddress;
  const description =
    order.description ||
    `Listing by ${order.realtor.firstName} ${order.realtor.lastName}`;
  const image = order.photos[0]?.urlMls || order.photos[0]?.url;
  return {
    title: `${title} — Media Portal`,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ orderId: string; template: string }>;
}) {
  const { orderId, template } = await params;
  const order = await getOrder(orderId);
  if (!order) notFound();

  // Support values like "v2" or just "2"
  const match = (template || '').match(/\d+/);
  const tNum = match ? Number(match[0]) : NaN;

  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
  const proto =
    hdrs.get('x-forwarded-proto') ??
    (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : '');
  const heroUrl = order.photos[0]?.url || order.photos[0]?.urlMls || undefined;

  return (
    <div className="min-h-screen bg-white">
      {/* Simple preload of hero for CLS reduction */}
      {heroUrl ? <link rel="preload" as="image" href={heroUrl} /> : null}
      {tNum === 1 && <PropertyTemplateV1 order={order} baseUrl={baseUrl} />}
      {tNum === 2 && <PropertyTemplateV2 order={order} baseUrl={baseUrl} />}
      {tNum === 3 && <PropertyTemplateV3 order={order} baseUrl={baseUrl} />}
      {![1, 2, 3].includes(tNum) && (
        <PropertyTemplateV1 order={order} baseUrl={baseUrl} />
      )}
    </div>
  );
}
