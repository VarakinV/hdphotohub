import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url');
    const filename = req.nextUrl.searchParams.get('filename') || 'download';
    if (!url) return new NextResponse('Missing url', { status: 400 });

    const res = await fetch(url);
    if (!res.ok) return new NextResponse('Upstream fetch failed', { status: 502 });

    let contentType = res.headers.get('content-type') || 'application/octet-stream';
    // Force download behavior for SVGs to avoid inline rendering
    if (contentType.includes('image/svg')) {
      contentType = 'application/octet-stream';
    }

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${sanitizeFilename(filename)}"`,
      'Cache-Control': 'no-store',
    };

    // Forward content-length if available so the browser can show download progress
    const contentLength = res.headers.get('content-length');
    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    // Stream the response body instead of buffering to avoid
    // exceeding Vercel's serverless function memory / body-size limits
    // for large files (e.g. videos).
    const body = res.body;

    return new Response(body, {
      status: 200,
      headers,
    });
  } catch (e) {
    console.error(e);
    return new NextResponse('Failed', { status: 500 });
  }
}

function sanitizeFilename(name: string) {
  return name.replace(/[^A-Za-z0-9._-]/g, '_');
}

