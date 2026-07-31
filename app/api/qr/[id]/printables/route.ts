import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { generateQrPrintArtifacts, type PrintVariant } from '@/lib/qr/print-generator';

const PRINT_VARIANTS = [
  'bare-qr',
  'rider-scan-info',
  'rider-scan-tour-price',
  'rider-scan-see-inside',
  'decal-scan-info',
  'decal-scan-tour-price',
  'decal-scan-see-inside',
] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const user = session.user as any;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    const realtorId = user?.realtorId as string | undefined;

    const qrCode = await prisma.qRCode.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { unassignedAt: null },
          include: {
            order: true,
          },
        },
      },
    });

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
    }

    if (!isAdmin) {
      const currentAssignment = qrCode.assignments[0];
      if (!currentAssignment || currentAssignment.order.realtorId !== realtorId) {
        return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const qrUrl = `${baseUrl}/q/${qrCode.displayId}`;

    await prisma.qRPrintable.deleteMany({
      where: { qrCodeId: qrCode.id },
    });

    const printables = await prisma.qRPrintable.createMany({
      data: PRINT_VARIANTS.map((variantKey) => ({
        qrCodeId: qrCode.id,
        variantKey,
        status: 'QUEUED' as const,
      })),
    });

    const createdPrintables = await prisma.qRPrintable.findMany({
      where: { qrCodeId: qrCode.id },
      orderBy: { createdAt: 'asc' },
    });

    for (const printable of createdPrintables) {
      try {
        await prisma.qRPrintable.update({
          where: { id: printable.id },
          data: { status: 'RENDERING' },
        });

        const artifacts = await generateQrPrintArtifacts(
          qrUrl,
          qrCode.displayId,
          printable.variantKey as PrintVariant
        );

        await prisma.qRPrintable.update({
          where: { id: printable.id },
          data: {
            status: 'COMPLETE',
            pngUrl: artifacts.pngUrl,
            pdfUrl: artifacts.pdfUrl,
          },
        });
      } catch (error) {
        console.error(`[QR PRINT] Failed to generate ${printable.variantKey}:`, error);
        await prisma.qRPrintable.update({
          where: { id: printable.id },
          data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Generation failed',
          },
        });
      }
    }

    const finalPrintables = await prisma.qRPrintable.findMany({
      where: { qrCodeId: qrCode.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ printables: finalPrintables });
  } catch (e) {
    console.error('[QR PRINTABLES]', e);
    return NextResponse.json({ error: 'Failed to generate printables' }, { status: 500 });
  }
}
