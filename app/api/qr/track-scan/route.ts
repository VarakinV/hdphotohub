import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createHash } from 'crypto';

const SESSION_COOKIE_NAME = 'qr_session';
const DEDUPE_WINDOW_MINUTES = 10;

function getSessionHash(request: NextRequest): string {
  let sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }

  const hash = createHash('sha256')
    .update(sessionId + (process.env.SESSION_HASH_SECRET || 'qr-lead-capture-secret'))
    .digest('hex');

  return hash;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignmentId } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: 'Missing assignmentId' }, { status: 400 });
    }

    const assignment = await prisma.qRAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        qrCode: true,
      },
    });

    if (!assignment || assignment.unassignedAt !== null) {
      return NextResponse.json({ error: 'Invalid assignment' }, { status: 404 });
    }

    const sessionHash = getSessionHash(request);

    const dedupeWindowStart = new Date(Date.now() - DEDUPE_WINDOW_MINUTES * 60 * 1000);

    const existingScan = await prisma.qRScanEvent.findFirst({
      where: {
        assignmentId,
        sessionHash,
        scannedAt: {
          gte: dedupeWindowStart,
        },
      },
    });

    if (existingScan) {
      const response = NextResponse.json({ ok: true, deduped: true });
      if (!request.cookies.get(SESSION_COOKIE_NAME)) {
        response.cookies.set(SESSION_COOKIE_NAME, crypto.randomUUID(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        });
      }
      return response;
    }

    await prisma.qRScanEvent.create({
      data: {
        assignmentId,
        sessionHash,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    const response = NextResponse.json({ ok: true, deduped: false });

    if (!request.cookies.get(SESSION_COOKIE_NAME)) {
      response.cookies.set(SESSION_COOKIE_NAME, crypto.randomUUID(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    return response;
  } catch (e) {
    console.error('[QR TRACK SCAN]', e);
    return NextResponse.json({ error: 'Failed to track scan' }, { status: 500 });
  }
}
