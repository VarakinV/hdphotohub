import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Schema for creating/updating a realtor
const realtorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  // Treat empty strings as undefined so they pass validation and become null in DB
  phone: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().nullable()),
  headshot: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  companyName: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().nullable()),
  companyLogo: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  facebookUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  linkedinUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  instagramUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  youtubeUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  twitterUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  pinterestUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  vimeoUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  tiktokUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
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
        where: {
          OR: [
            { assignedAdmins: { some: { adminId: me.id } } },
            { userId: me.id },
          ],
        },
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

    const { firstName, lastName, email, phone, headshot, companyName, companyLogo, facebookUrl, linkedinUrl, instagramUrl, youtubeUrl, twitterUrl, pinterestUrl, vimeoUrl, tiktokUrl } = validatedFields.data;

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
        facebookUrl: facebookUrl || null,
        linkedinUrl: linkedinUrl || null,
        instagramUrl: instagramUrl || null,
        youtubeUrl: youtubeUrl || null,
        twitterUrl: twitterUrl || null,
        pinterestUrl: pinterestUrl || null,
        vimeoUrl: vimeoUrl || null,
        tiktokUrl: tiktokUrl || null,
        userId: session.user.id,
      },
    });

    // Auto-assign the creating admin to this realtor so it appears in their list
    try {
      const adminId = session.user.id;
      await prisma.realtorAssignment.upsert({
        where: { adminId_realtorId: { adminId, realtorId: realtor.id } },
        create: { adminId, realtorId: realtor.id },
        update: {},
      });
    } catch (e) {
      console.warn('Failed to create self-assignment for admin -> realtor', e);
    }

    return NextResponse.json(realtor, { status: 201 });
  } catch (error) {
    console.error("Error creating realtor:", error);
    return NextResponse.json(
      { error: "Failed to create realtor" },
      { status: 500 }
    );
  }
}