import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { deleteFromS3 } from "@/lib/utils/s3";

// Schema for updating a realtor
const updateRealtorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().nullable()),
  headshot: z.string().url().optional().nullable(),
  companyName: z.string().optional().nullable(),
  companyLogo: z.string().url().optional().nullable(),
  facebookUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  linkedinUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  instagramUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  youtubeUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  twitterUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  pinterestUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  vimeoUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
});

// GET /api/realtors/[id] - Get a single realtor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const realtor = await prisma.realtor.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!realtor) {
      return NextResponse.json(
        { error: "Realtor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(realtor);
  } catch (error) {
    console.error("Error fetching realtor:", error);
    return NextResponse.json(
      { error: "Failed to fetch realtor" },
      { status: 500 }
    );
  }
}

// PUT /api/realtors/[id] - Update a realtor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedFields = updateRealtorSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, headshot, companyName, companyLogo, facebookUrl, linkedinUrl, instagramUrl, youtubeUrl, twitterUrl, pinterestUrl, vimeoUrl } = validatedFields.data;

    // Check if realtor exists and belongs to the user
    const existingRealtor = await prisma.realtor.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingRealtor) {
      return NextResponse.json(
        { error: "Realtor not found" },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (email !== existingRealtor.email) {
      const emailTaken = await prisma.realtor.findUnique({
        where: { email },
      });

      if (emailTaken) {
        return NextResponse.json(
          { error: "A realtor with this email already exists" },
          { status: 409 }
        );
      }
    }

    // If headshot is being removed or changed, delete the old one from S3
    if (existingRealtor.headshot && existingRealtor.headshot !== headshot) {
      await deleteFromS3(existingRealtor.headshot);
    }
    // If companyLogo is being removed or changed, delete the old one from S3
    if (existingRealtor.companyLogo && existingRealtor.companyLogo !== companyLogo) {
      await deleteFromS3(existingRealtor.companyLogo);
    }

    // Update realtor
    const updatedRealtor = await prisma.realtor.update({
      where: { id },
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
      },
    });

    return NextResponse.json(updatedRealtor);
  } catch (error) {
    console.error("Error updating realtor:", error);
    return NextResponse.json(
      { error: "Failed to update realtor" },
      { status: 500 }
    );
  }
}

// DELETE /api/realtors/[id] - Delete a realtor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if realtor exists and belongs to the user
    const realtor = await prisma.realtor.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!realtor) {
      return NextResponse.json(
        { error: "Realtor not found" },
        { status: 404 }
      );
    }

    // Check for dependent Orders BEFORE deleting (we block delete if any orders exist)
    const orderCount = await prisma.order.count({ where: { realtorId: id } });
    if (orderCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete realtor with existing orders",
          details: [`This realtor has ${orderCount} order(s). Delete or reassign those orders before deleting the realtor.`],
        },
        { status: 409 }
      );
    }

    // Capture asset urls before DB changes
    const headshotUrl = realtor.headshot;
    const companyLogoUrl = realtor.companyLogo;

    // Remove relationships that would violate FKs, then delete the realtor
    await prisma.$transaction([
      prisma.realtorAssignment.deleteMany({ where: { realtorId: id } }),
      prisma.user.updateMany({ where: { realtorId: id }, data: { realtorId: null } }),
      prisma.invitation.updateMany({ where: { realtorId: id }, data: { realtorId: null } }),
      prisma.booking.updateMany({ where: { realtorId: id }, data: { realtorId: null } }),
      prisma.realtor.delete({ where: { id } }),
    ]);

    // Best-effort S3 cleanup after successful DB deletion
    try { if (headshotUrl) { await deleteFromS3(headshotUrl); } } catch (e) { console.warn('Failed to delete headshot from S3', e); }
    try { if (companyLogoUrl) { await deleteFromS3(companyLogoUrl); } } catch (e) { console.warn('Failed to delete company logo from S3', e); }

    return NextResponse.json(
      { message: "Realtor deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting realtor:", error);
    return NextResponse.json(
      { error: "Failed to delete realtor" },
      { status: 500 }
    );
  }
}