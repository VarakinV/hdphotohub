import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Check if S3 is configured
const isS3Configured = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET_NAME
);

// Initialize S3 client only if configured
const s3Client = isS3Configured
  ? new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

/**
 * Generate a presigned URL for uploading a file directly from the browser to S3
 * (legacy headshot helper)
 */
export async function getPresignedUploadUrl(
  fileName: string,
  fileType: string
): Promise<{ uploadUrl: string; fileKey: string; fileUrl: string }> {
  return getPresignedUploadUrlForPath(`realtors/headshots`, fileName, fileType);
}

/**
 * Generalized presigned URL generator for a given S3 folder path
 */
export async function getPresignedUploadUrlForPath(
  basePath: string,
  fileName: string,
  fileType: string
): Promise<{ uploadUrl: string; fileKey: string; fileUrl: string }> {
  if (!isS3Configured || !s3Client) {
    throw new Error("S3 is not configured. Please set AWS credentials in environment variables.");
  }

  const ext = (fileName.split(".").pop() || '').toLowerCase();
  const fileKey = `${basePath}/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${fileKey}`;

  return { uploadUrl, fileKey, fileUrl };
}

/**
 * Generate a presigned URL for uploading order media by category
 */
export async function getOrderMediaPresignedUrl(
  orderId: string,
  category: 'photos' | 'videos' | 'floorplans' | 'attachments',
  fileName: string,
  fileType: string
): Promise<{ uploadUrl: string; fileKey: string; fileUrl: string }> {
  const basePath = `orders/${orderId}/${category}`;
  return getPresignedUploadUrlForPath(basePath, fileName, fileType);
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(fileUrl: string): Promise<void> {
  if (!isS3Configured || !s3Client) {
    console.log("S3 not configured, skipping delete");
    return;
  }

  try {
    // Extract the key from the URL
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    // Don't throw error as the file might already be deleted
  }
}

/**
 * Check if S3 is properly configured
 */
export function isS3Available(): boolean {
  return isS3Configured;
}

/**
 * Validate file type for headshot uploads
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Please upload a valid image file (JPEG, PNG, or WebP)",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size must be less than 5MB",
    };
  }

  return { valid: true };
}

/**
 * Upload a buffer to S3 at a specific base path and file name
 */
export async function uploadBufferToS3WithPath(
  basePath: string,
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<{ fileKey: string; fileUrl: string }> {
  if (!isS3Configured || !s3Client) {
    throw new Error("S3 is not configured. Please set AWS credentials in environment variables.");
  }
  const key = `${basePath}/${fileName}`;
  const command = new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key, Body: buffer, ContentType: contentType });
  await s3Client.send(command);
  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
  return { fileKey: key, fileUrl };
}
