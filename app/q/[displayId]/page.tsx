import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import { QRCodeGate } from '@/components/qr/QRCodeGate';

async function getQRCodeData(displayId: string) {
  const qrCode = await prisma.qRCode.findUnique({
    where: { displayId },
    include: {
      assignments: {
        where: { unassignedAt: null },
        include: {
          order: {
            include: {
              realtor: true,
              photos: {
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                take: 1,
              },
              propertyPages: {
                where: { published: true },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
          propertyPage: true,
        },
      },
    },
  });

  if (!qrCode) return null;

  const currentAssignment = qrCode.assignments[0] || null;

  return {
    qrCode,
    currentAssignment,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ displayId: string }>;
}): Promise<Metadata> {
  const { displayId } = await params;
  const data = await getQRCodeData(displayId);

  if (!data || !data.currentAssignment) {
    return {
      title: 'QR Code',
      description: 'Scan to view property details',
    };
  }

  const order = data.currentAssignment.order;
  const title = order.propertyFormattedAddress || order.propertyAddress;
  const heroUrl = order.photos[0]?.url || order.photos[0]?.urlMls;

  return {
    title: `${title} — Property Details`,
    description: `View photos, virtual tour, and more for ${title}`,
    openGraph: {
      title,
      description: `View photos, virtual tour, and more for ${title}`,
      images: heroUrl ? [{ url: heroUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: `View photos, virtual tour, and more for ${title}`,
      images: heroUrl ? [{ url: heroUrl }] : undefined,
    },
  };
}

export default async function QRCodeGatePage({
  params,
}: {
  params: Promise<{ displayId: string }>;
}) {
  const { displayId } = await params;
  const data = await getQRCodeData(displayId);

  if (!data) {
    notFound();
  }

  const { qrCode, currentAssignment } = data;

  return (
    <QRCodeGate
      displayId={displayId}
      status={qrCode.status}
      assignment={
        currentAssignment
          ? {
              id: currentAssignment.id,
              order: {
                id: currentAssignment.order.id,
                propertyAddress: currentAssignment.order.propertyFormattedAddress || currentAssignment.order.propertyAddress,
                heroPhotoUrl: currentAssignment.order.photos[0]?.url || currentAssignment.order.photos[0]?.urlMls || null,
                propertyPageUrlPath: currentAssignment.propertyPage?.urlPath || currentAssignment.order.propertyPages[0]?.urlPath || null,
              },
              realtor: {
                headshot: currentAssignment.order.realtor.headshot || null,
                companyName: currentAssignment.order.realtor.companyName || null,
                companyLogo: currentAssignment.order.realtor.companyLogo || null,
                firstName: currentAssignment.order.realtor.firstName,
                lastName: currentAssignment.order.realtor.lastName,
              },
            }
          : null
      }
    />
  );
}
