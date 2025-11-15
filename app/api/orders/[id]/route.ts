import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { deleteFromS3 } from '@/lib/utils/s3';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { realtor: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, headshot: true, companyName: true, companyLogo: true } } },
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Allow if admin or if user's realtor membership matches the order's realtor
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) {
      if (!realtorId || order.realtorId !== realtorId) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }

    return NextResponse.json(order);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    // Permission check
    const current = await prisma.order.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) {
      if (!realtorId || current.realtorId !== realtorId) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }

    const body = await req.json();

    // Only allow updates to property data and status for now
    const updated = await prisma.order.update({
      where: { id },
      data: {
        propertyAddress: body.propertyAddress,
        propertyFormattedAddress: body.propertyFormattedAddress ?? null,
        propertyLat: body.propertyLat == null || body.propertyLat === '' ? null : Number(body.propertyLat),
        propertyLng: body.propertyLng == null || body.propertyLng === '' ? null : Number(body.propertyLng),
        propertyCity: body.propertyCity ?? null,
        propertyProvince: body.propertyProvince ?? null,
        propertyPostalCode: body.propertyPostalCode ?? null,
        propertyCountry: body.propertyCountry ?? null,
        propertyPlaceId: body.propertyPlaceId ?? null,
        propertyAddressOverride: body.propertyAddressOverride ?? null,
        propertyCityOverride: body.propertyCityOverride ?? null,
        propertyPostalCodeOverride: body.propertyPostalCodeOverride ?? null,
        propertySize: body.propertySize == null || body.propertySize === '' ? null : Number(body.propertySize),
        yearBuilt: body.yearBuilt == null || body.yearBuilt === '' ? null : Number(body.yearBuilt),
        mlsNumber: body.mlsNumber ?? null,
        listPrice: body.listPrice == null || body.listPrice === '' ? null : Number(body.listPrice),
        bedrooms: body.bedrooms == null || body.bedrooms === '' ? null : String(body.bedrooms),
        bathrooms: body.bathrooms == null || body.bathrooms === '' ? null : String(body.bathrooms),
        featuresText: body.featuresText ?? null,
        description: body.description ?? null,
        status: body.status ?? undefined,
      },
      include: { realtor: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, headshot: true, companyName: true, companyLogo: true } } },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    // Permission check
    const current = await prisma.order.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) {
      if (!realtorId || current.realtorId !== realtorId) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }

    const body: any = await req.json();
    const data: any = {};

    if ('propertyAddress' in body) data.propertyAddress = body.propertyAddress;
    if ('propertyFormattedAddress' in body)
      data.propertyFormattedAddress = body.propertyFormattedAddress ?? null;
    if ('propertyLat' in body)
      data.propertyLat =
        body.propertyLat == null || body.propertyLat === ''
          ? null
          : Number(body.propertyLat);
    if ('propertyLng' in body)
      data.propertyLng =
        body.propertyLng == null || body.propertyLng === ''
          ? null
          : Number(body.propertyLng);
    if ('propertyCity' in body) data.propertyCity = body.propertyCity ?? null;
    if ('propertyProvince' in body)
      data.propertyProvince = body.propertyProvince ?? null;
    if ('propertyPostalCode' in body)
      data.propertyPostalCode = body.propertyPostalCode ?? null;
    if ('propertyCountry' in body)
      data.propertyCountry = body.propertyCountry ?? null;
    if ('propertyPlaceId' in body)
      data.propertyPlaceId = body.propertyPlaceId ?? null;
    if ('propertyAddressOverride' in body)
      data.propertyAddressOverride = body.propertyAddressOverride ?? null;
    if ('propertyCityOverride' in body)
      data.propertyCityOverride = body.propertyCityOverride ?? null;
    if ('propertyPostalCodeOverride' in body)
      data.propertyPostalCodeOverride = body.propertyPostalCodeOverride ?? null;
    if ('propertySize' in body)
      data.propertySize =
        body.propertySize == null || body.propertySize === ''
          ? null
          : Number(body.propertySize);
    if ('yearBuilt' in body)
      data.yearBuilt =
        body.yearBuilt == null || body.yearBuilt === ''
          ? null
          : Number(body.yearBuilt);
    if ('mlsNumber' in body) data.mlsNumber = body.mlsNumber ?? null;
    if ('listPrice' in body)
      data.listPrice =
        body.listPrice == null || body.listPrice === ''
          ? null
          : Number(body.listPrice);
    if ('bedrooms' in body)
      data.bedrooms =
        body.bedrooms == null || body.bedrooms === ''
          ? null
          : Number(body.bedrooms);
    if ('bathrooms' in body)
      data.bathrooms =
        body.bathrooms == null || body.bathrooms === ''
          ? null
          : Number(body.bathrooms);
    if ('featuresText' in body) data.featuresText = body.featuresText ?? null;
    if ('description' in body) data.description = body.description ?? null;
    if ('status' in body) data.status = body.status;

    const updated = await prisma.order.update({
      where: { id },
      data,
      include: { realtor: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, headshot: true, companyName: true, companyLogo: true } } },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}


export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    // Verify permission
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) {
      if (!realtorId || order.realtorId !== realtorId) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }

    // Fetch related media to delete from S3
    const [photos, videos, floors, attaches, reelSources] = await Promise.all([
      prisma.photo.findMany({ where: { orderId: id } }),
      prisma.video.findMany({ where: { orderId: id } }),
      prisma.floorPlan.findMany({ where: { orderId: id } }),
      prisma.attachment.findMany({ where: { orderId: id } }),
      prisma.orderReelSourceImage.findMany({ where: { orderId: id } }),
    ]);

    // Best-effort S3 cleanup (non-blocking failures)
    await Promise.all([
      ...photos.map(async (p) => { try { await deleteFromS3(p.url); if (p.urlMls) await deleteFromS3(p.urlMls); } catch {} }),
      ...videos.map(async (v) => { try { await deleteFromS3(v.url); } catch {} }),
      ...floors.map(async (f) => { try { await deleteFromS3(f.url); } catch {} }),
      ...attaches.map(async (a) => { try { await deleteFromS3(a.url); } catch {} }),
      ...reelSources.map(async (s) => { try { await deleteFromS3(s.url); } catch {} }),
    ]);

    // Delete DB records in a transaction (delete children first to satisfy FK constraints)
    await prisma.$transaction([
      prisma.photo.deleteMany({ where: { orderId: id } }),
      prisma.video.deleteMany({ where: { orderId: id } }),
      prisma.floorPlan.deleteMany({ where: { orderId: id } }),
      prisma.attachment.deleteMany({ where: { orderId: id } }),
      prisma.embed.deleteMany({ where: { orderId: id } }),
      prisma.orderReelSourceImage.deleteMany({ where: { orderId: id } }),
      prisma.orderReel.deleteMany({ where: { orderId: id } }),
      prisma.propertyInquiry.deleteMany({ where: { orderId: id } }),
      prisma.propertyPage.deleteMany({ where: { orderId: id } }),
      prisma.order.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
