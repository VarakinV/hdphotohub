import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';

export async function GET(
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
          include: {
            order: {
              include: {
                realtor: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            propertyPage: true,
            scans: {
              orderBy: { scannedAt: 'desc' },
            },
            leads: {
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
    }

    if (!isAdmin) {
      const hasAccess = qrCode.assignments.some(
        (a) => a.order.realtorId === realtorId
      );
      if (!hasAccess && qrCode.createdByUserId !== session.user.id) {
        return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
      }
    }

    const assignmentStats = qrCode.assignments.map((assignment) => {
      const totalScans = assignment.scans.length;
      const totalLeads = assignment.leads.length;

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const recentScans = assignment.scans.filter(
        (s) => s.scannedAt >= sevenDaysAgo
      ).length;
      const recentLeads = assignment.leads.filter(
        (l) => l.createdAt >= sevenDaysAgo
      ).length;

      return {
        id: assignment.id,
        assignedAt: assignment.assignedAt,
        unassignedAt: assignment.unassignedAt,
        sendWeeklyStats: assignment.sendWeeklyStats,
        order: {
          id: assignment.order.id,
          propertyAddress: assignment.order.propertyFormattedAddress || assignment.order.propertyAddress,
          realtor: assignment.order.realtor,
        },
        propertyPage: assignment.propertyPage,
        totalScans,
        totalLeads,
        recentScans,
        recentLeads,
        scans: assignment.scans.map((s) => ({
          id: s.id,
          scannedAt: s.scannedAt,
          userAgent: s.userAgent,
        })),
        leads: assignment.leads.map((l) => ({
          id: l.id,
          name: l.name,
          email: l.email,
          phone: l.phone,
          createdAt: l.createdAt,
        })),
      };
    });

    return NextResponse.json({
      qrCode: {
        id: qrCode.id,
        displayId: qrCode.displayId,
        status: qrCode.status,
        createdAt: qrCode.createdAt,
      },
      assignments: assignmentStats,
    });
  } catch (e) {
    console.error('[QR STATS]', e);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
