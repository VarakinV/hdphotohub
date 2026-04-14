import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { transformToTwilight, generateVideo } from '@/lib/kie/kie-provider';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; reelId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, reelId } = await params;
    const user = session.user as any;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const reel = await prisma.orderAiReel.findUnique({ where: { id: reelId } });
    if (!reel || reel.orderId !== id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Determine which step to retry based on the first failed step
    const baseUrl = (
      process.env.KIE_WEBHOOK_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      ''
    ).replace(/\/$/, '');

    if (reel.kieImageStatus === 'FAILED') {
      // Retry Step 1: Image transform
      const callbackUrl = `${baseUrl}/api/integrations/kie/webhook?aiReelId=${reel.id}&step=image`;
      const { taskId } = await transformToTwilight(reel.sourceImageUrl, callbackUrl);
      await prisma.orderAiReel.update({
        where: { id: reelId },
        data: { kieImageStatus: 'PROCESSING', kieImageTaskId: taskId, error: null },
      });
      return NextResponse.json({ ok: true, retryStep: 'image' });
    }

    if (reel.kieVideoStatus === 'FAILED' && reel.twilightImageUrl) {
      // Retry Step 2: Video generation
      const callbackUrl = `${baseUrl}/api/integrations/kie/webhook?aiReelId=${reel.id}&step=video`;
      const { taskId } = await generateVideo(reel.sourceImageUrl, reel.twilightImageUrl, callbackUrl);
      await prisma.orderAiReel.update({
        where: { id: reelId },
        data: { kieVideoStatus: 'PROCESSING', kieVideoTaskId: taskId, error: null },
      });
      return NextResponse.json({ ok: true, retryStep: 'video' });
    }

    if (reel.j2vStatus === 'FAILED' && reel.videoUrl) {
      // Retry Step 3: J2V render — re-trigger from the Kie video webhook logic
      // Reset status so the webhook handler can re-process
      await prisma.orderAiReel.update({
        where: { id: reelId },
        data: { kieVideoStatus: 'COMPLETE', j2vStatus: 'PENDING', error: null },
      });
      // Simulate the video callback by importing the handler logic
      const { triggerJ2VRender } = await import('@/lib/kie/trigger-j2v');
      await triggerJ2VRender(reel.id, baseUrl);
      return NextResponse.json({ ok: true, retryStep: 'j2v' });
    }

    return NextResponse.json({ error: 'No failed step to retry' }, { status: 400 });
  } catch (e: any) {
    console.error('AI reel retry error:', e?.message || e);
    return NextResponse.json({ error: 'Retry failed', detail: e?.message }, { status: 500 });
  }
}
