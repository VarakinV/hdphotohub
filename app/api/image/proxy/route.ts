import { NextRequest } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const isS3Configured = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET_NAME
);

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';
const REGION = process.env.AWS_REGION || 'us-east-1';

const s3Client = isS3Configured
  ? new S3Client({
      region: REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

export async function GET(req: NextRequest) {
  try {
    if (!isS3Configured || !s3Client) {
      return new Response('S3 not configured', { status: 503 });
    }

    const urlParam = req.nextUrl.searchParams.get('url');
    if (!urlParam) return new Response('Missing url', { status: 400 });

    let key = '';
    try {
      const u = new URL(urlParam);
      const expectedHost = `${BUCKET_NAME}.s3.${REGION}.amazonaws.com`;
      if (u.host !== expectedHost) {
        return new Response('Invalid host', { status: 400 });
      }
      key = u.pathname.replace(/^\//, '');
    } catch {
      return new Response('Invalid url', { status: 400 });
    }

    const cmd = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const obj = await s3Client.send(cmd);

    const body = obj.Body as any;
    // @ts-ignore transformToWebStream is available in Node 18
    const stream = typeof body?.transformToWebStream === 'function' ? body.transformToWebStream() : body;
    const contentType = obj.ContentType || 'application/octet-stream';

    return new Response(stream as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch (e) {
    console.error('Image proxy error', e);
    return new Response('Failed to fetch image', { status: 500 });
  }
}

