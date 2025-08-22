import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPresignedUploadUrl, isS3Available } from "@/lib/utils/s3";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if S3 is configured
    if (!isS3Available()) {
      return NextResponse.json(
        { error: "S3 is not configured. Please set AWS credentials in environment variables to enable file uploads." },
        { status: 503 }
      );
    }

    const { fileName, fileType } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "File name and type are required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 }
      );
    }

    const presignedData = await getPresignedUploadUrl(fileName, fileType);

    return NextResponse.json(presignedData);
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}