import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

// Schema for creating/updating a realtor
const realtorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  headshot: z.string().url().optional(),
  companyName: z.string().optional(),
  companyLogo: z.string().url().optional(),
});

// GET /api/realtors - Get all realtors for the current user
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const me: any = session.user;

    let realtors;
    if (me.role === 'SUPERADMIN') {
      // Superadmin can see all realtors
      realtors = await prisma.realtor.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } else if (me.role === 'ADMIN') {
      // Admin sees realtors assigned to them via RealtorAssignment
      realtors = await prisma.realtor.findMany({
        where: { assignedAdmins: { some: { adminId: me.id } } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Others: no access via this admin endpoint
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(realtors);
  } catch (error) {
    console.error("Error fetching realtors:", error);
    return NextResponse.json(
      { error: "Failed to fetch realtors" },
      { status: 500 }
    );
  }
}

// POST /api/realtors - Create a new realtor
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedFields = realtorSchema.safeParse(body);
    
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, headshot, companyName, companyLogo } = validatedFields.data;

    // Check if realtor with this email already exists
    const existingRealtor = await prisma.realtor.findUnique({
      where: { email },
    });

    if (existingRealtor) {
      return NextResponse.json(
        { error: "A realtor with this email already exists" },
        { status: 409 }
      );
    }

    // Create realtor
    const realtor = await prisma.realtor.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        headshot: headshot || null,
        companyName: companyName || null,
        companyLogo: companyLogo || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(realtor, { status: 201 });
  } catch (error) {
    console.error("Error creating realtor:", error);
    return NextResponse.json(
      { error: "Failed to create realtor" },
      { status: 500 }
    );
  }
}