import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";

function getMonthRange(year: number, monthIndex: number) {
  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));
  return { start, end };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const search = req.nextUrl.searchParams;
    const yearParam = search.get("year");
    const now = new Date();
    const year = yearParam ? Number(yearParam) : now.getUTCFullYear();
    const { start: monthStart, end: monthEnd } = getMonthRange(now.getUTCFullYear(), now.getUTCMonth());

    // Total orders all-time for this account
    const totalAllTime = await prisma.order.count({
      where: { realtor: { userId: session.user.id } },
    });

    // Total orders this month
    const totalThisMonth = await prisma.order.count({
      where: {
        realtor: { userId: session.user.id },
        createdAt: { gte: monthStart, lt: monthEnd },
      },
    });

    // Orders by month for selected year (12 counts)
    const byMonthPromises: Promise<number>[] = [];
    for (let m = 0; m < 12; m++) {
      const { start, end } = getMonthRange(year, m);
      byMonthPromises.push(
        prisma.order.count({ where: { realtor: { userId: session.user.id }, createdAt: { gte: start, lt: end } } })
      );
    }
    const byMonthCounts = await Promise.all(byMonthPromises);

    // Top realtors this month (by number of orders)
    const grouped = await prisma.order.groupBy({
      by: ["realtorId"],
      where: { realtor: { userId: session.user.id }, createdAt: { gte: monthStart, lt: monthEnd } },
      _count: { id: true },
    });

    const realtorIds = grouped.map((g) => g.realtorId);
    const realtors = realtorIds.length
      ? await prisma.realtor.findMany({
          where: { id: { in: realtorIds } },
          select: { id: true, firstName: true, lastName: true, headshot: true },
        })
      : [];
    const realtorMap = new Map(realtors.map((r) => [r.id, r] as const));
    const topRealtors = grouped
      .map((g) => ({ count: g._count.id as number, realtor: realtorMap.get(g.realtorId) }))
      .filter((x) => x.realtor)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Last 5 orders
    const lastOrders = await prisma.order.findMany({
      where: { realtor: { userId: session.user.id } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, propertyAddress: true, createdAt: true },
    });

    return NextResponse.json({
      totals: { month: totalThisMonth, allTime: totalAllTime },
      byMonth: { year, series: byMonthCounts },
      topRealtors,
      lastOrders,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load dashboard stats" }, { status: 500 });
  }
}

