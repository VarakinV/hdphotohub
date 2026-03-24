import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const pointsSchema = z.object({
  amount: z.number().int().positive("Amount must be a positive integer"),
  type: z.enum(["add", "redeem"]),
  reason: z.string().min(1, "Reason is required"),
});

// GET /api/realtors/[id]/points — list point transactions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const perPage = Math.min(50, Math.max(1, Number(searchParams.get("perPage") || "20")));

    const user = session.user as any;

    // Allow access if: admin owns the realtor OR the logged-in user IS this realtor
    const realtor = await prisma.realtor.findFirst({
      where: {
        id,
        OR: [
          { userId: user.id },
          { users: { some: { id: user.id } } },
        ],
      },
      select: { id: true, points: true },
    });

    if (!realtor) {
      return NextResponse.json({ error: "Realtor not found" }, { status: 404 });
    }

    const [transactions, total] = await Promise.all([
      prisma.pointTransaction.findMany({
        where: { realtorId: id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.pointTransaction.count({ where: { realtorId: id } }),
    ]);

    return NextResponse.json({
      balance: realtor.points,
      transactions,
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    });
  } catch (error) {
    console.error("Error fetching point transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

// POST /api/realtors/[id]/points — create a point transaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const parsed = pointsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { amount, type, reason } = parsed.data;
    const delta = type === "add" ? amount : -amount;

    const realtor = await prisma.realtor.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, points: true, firstName: true, lastName: true, email: true },
    });

    if (!realtor) {
      return NextResponse.json({ error: "Realtor not found" }, { status: 404 });
    }

    const newBalance = Math.max(0, realtor.points + delta);

    // Atomic: create transaction + update balance
    const [transaction] = await prisma.$transaction([
      prisma.pointTransaction.create({
        data: {
          realtorId: id,
          amount: delta,
          reason,
          createdBy: session.user.id,
        },
      }),
      prisma.realtor.update({
        where: { id },
        data: { points: newBalance },
      }),
    ]);

    // Sync to GHL
    try {
      const apiKey = process.env.GHL_API_KEY;
      const locationId = process.env.GHL_LOCATION_ID;
      const apiVersion = process.env.GHL_API_VERSION || process.env.GHL_APPOINTMENTS_API_VERSION;
      if (apiKey && locationId && apiVersion) {
        await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            Version: apiVersion,
          },
          body: JSON.stringify({
            firstName: realtor.firstName,
            lastName: realtor.lastName,
            email: realtor.email,
            locationId,
            customFields: [{ key: "points", field_value: newBalance }],
          }),
        });
      }
    } catch (e) {
      console.error("Failed to sync points to GHL", e);
    }

    return NextResponse.json({ transaction, balance: newBalance }, { status: 201 });
  } catch (error) {
    console.error("Error creating point transaction:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}

