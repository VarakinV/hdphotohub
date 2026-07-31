import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { deleteFromS3 } from '@/lib/utils/s3';

export async function DELETE(
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
      if (qrCode.createdByUserId !== session.user.id) {
        const currentAssignment = qrCode.assignments[0];
        if (!currentAssignment || currentAssignment.order.realtorId !== realtorId) {
          return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
        }
      }
    }

    const printables = await prisma.qRPrintable.findMany({
      where: { qrCodeId: id },
      select: { pngUrl: true, pdfUrl: true },
    });

    for (const printable of printables) {
      if (printable.pngUrl) {
        await deleteFromS3(printable.pngUrl);
      }
      if (printable.pdfUrl) {
        await deleteFromS3(printable.pdfUrl);
      }
    }

    await prisma.$transaction(async (tx) => {
      const assignments = await tx.qRAssignment.findMany({
        where: { qrCodeId: id },
        select: { id: true },
      });
      const assignmentIds = assignments.map((a) => a.id);

      await tx.qRScanEvent.deleteMany({
        where: { assignmentId: { in: assignmentIds } },
      });

      await tx.propertyInquiry.deleteMany({
        where: { qrAssignmentId: { in: assignmentIds } },
      });

      await tx.qRPrintable.deleteMany({
        where: { qrCodeId: id },
      });

      await tx.qRAssignment.deleteMany({
        where: { qrCodeId: id },
      });

      await tx.qRCode.delete({
        where: { id },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[QR DELETE]', e);
    return NextResponse.json({ error: 'Failed to delete QR code' }, { status: 500 });
  }
}
