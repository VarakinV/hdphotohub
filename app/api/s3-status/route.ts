import { NextResponse } from 'next/server';
import { isS3Available } from '@/lib/utils/s3';

export async function GET() {
  try {
    const isConfigured = isS3Available();
    return NextResponse.json({ 
      isConfigured,
      bucketName: isConfigured ? process.env.AWS_S3_BUCKET_NAME : null 
    });
  } catch (error) {
    console.error('Error checking S3 status:', error);
    return NextResponse.json({ isConfigured: false }, { status: 500 });
  }
}