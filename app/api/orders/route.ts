import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  realtorId: z.string().min(1),
  propertyAddress: z.string().min(1),
  propertyFormattedAddress: z.string().optional().nullable(),
  propertyLat: z.number().optional().nullable(),
  propertyLng: z.number().optional().nullable(),
  propertyCity: z.string().optional().nullable(),
  propertyProvince: z.string().optional().nullable(),
  propertyPostalCode: z.string().optional().nullable(),
  propertyCountry: z.string().optional().nullable(),
  propertyPlaceId: z.string().optional().nullable(),
  propertySize: z.number().int().optional().nullable(),
  yearBuilt: z.number().int().optional().nullable(),
  mlsNumber: z.string().optional().nullable(),
  listPrice: z.number().int().optional().nullable(),
  bedrooms: z.number().int().optional().nullable(),
  bathrooms: z.number().int().optional().nullable(),
  description: z.string().optional().nullable(),
});

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 200);
}

async function generateUniqueSlug(clientName: string, propertyAddress: string) {
  const base = `${slugify(clientName)}/${slugify(propertyAddress)}`;
  let candidate = base;
  let n = 0;
  while (true) {
    const existing = await prisma.order.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    n += 1;
    candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    if (n > 10) throw new Error('Failed to generate unique slug');
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const me: any = session.user;
    let where: any = {};

    if (me.role === 'SUPERADMIN') {
      where = {};
    } else if (me.role === 'ADMIN') {
      where = {
        OR: [
          { realtor: { userId: me.id } },
          { realtor: { assignedAdmins: { some: { adminId: me.id } } } },
        ],
      };
    } else if (me.role === 'REALTOR') {
      // fallback for potential use by portal
      where = { realtorId: me.realtorId ?? '' };
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      where,
      include: { realtor: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = createSchema.safeParse({
      ...body,
      propertyLat: body.propertyLat == null || body.propertyLat === '' ? null : Number(body.propertyLat),
      propertyLng: body.propertyLng == null || body.propertyLng === '' ? null : Number(body.propertyLng),
      propertySize: body.propertySize == null || body.propertySize === '' ? null : Number(body.propertySize),
      yearBuilt: body.yearBuilt == null || body.yearBuilt === '' ? null : Number(body.yearBuilt),
      listPrice: body.listPrice == null || body.listPrice === '' ? null : Number(body.listPrice),
      bedrooms: body.bedrooms == null || body.bedrooms === '' ? null : Number(body.bedrooms),
      bathrooms: body.bathrooms == null || body.bathrooms === '' ? null : Number(body.bathrooms),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid fields', details: parsed.error.flatten() }, { status: 400 });
    }

    // Ensure realtor is accessible to the current user
    const me: any = session.user;
    let realtor = null as any;
    if (me.role === 'SUPERADMIN') {
      realtor = await prisma.realtor.findUnique({ where: { id: parsed.data.realtorId } });
    } else if (me.role === 'ADMIN') {
      realtor = await prisma.realtor.findFirst({
        where: {
          id: parsed.data.realtorId,
          OR: [
            { userId: me.id },
            { assignedAdmins: { some: { adminId: me.id } } },
          ],
        },
      });
    } else if (me.role === 'REALTOR') {
      if (parsed.data.realtorId !== me.realtorId) {
        return NextResponse.json({ error: 'Realtor not found' }, { status: 404 });
      }
      realtor = await prisma.realtor.findUnique({ where: { id: parsed.data.realtorId } });
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!realtor) return NextResponse.json({ error: 'Realtor not found' }, { status: 404 });

    const clientName = `${realtor.firstName} ${realtor.lastName}`;
    const slug = await generateUniqueSlug(clientName, parsed.data.propertyAddress);

    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          realtorId: parsed.data.realtorId,
          slug,
          status: 'DRAFT',
          propertyAddress: parsed.data.propertyAddress,
          propertyFormattedAddress: parsed.data.propertyFormattedAddress ?? null,
          propertyLat: parsed.data.propertyLat ?? null,
          propertyLng: parsed.data.propertyLng ?? null,
          propertyCity: parsed.data.propertyCity ?? null,
          propertyProvince: parsed.data.propertyProvince ?? null,
          propertyPostalCode: parsed.data.propertyPostalCode ?? null,
          propertyCountry: parsed.data.propertyCountry ?? null,
          propertyPlaceId: parsed.data.propertyPlaceId ?? null,
          propertySize: parsed.data.propertySize ?? null,
          yearBuilt: parsed.data.yearBuilt ?? null,
          mlsNumber: parsed.data.mlsNumber ?? null,
          listPrice: parsed.data.listPrice ?? null,
          bedrooms: parsed.data.bedrooms == null ? null : String(parsed.data.bedrooms),
          bathrooms: parsed.data.bathrooms == null ? null : String(parsed.data.bathrooms),
          description: parsed.data.description ?? null,
        },
        include: { realtor: { select: { id: true, firstName: true, lastName: true } } },
      }),
    ]);

    // Automatically create three PropertyPage variants for this order
    await prisma.propertyPage.createMany({
      data: [
        { orderId: order.id, template: 1, urlPath: `/property/${order.id}/v1`, published: true },
        { orderId: order.id, template: 2, urlPath: `/property/${order.id}/v2`, published: true },
        { orderId: order.id, template: 3, urlPath: `/property/${order.id}/v3`, published: true },
      ],
      skipDuplicates: true,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

