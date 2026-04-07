import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateVideo } from '@/lib/kie/kie-provider';
import { J2VProvider } from '@/lib/video/j2v-provider';
import { formatPhoneNumber } from '@/lib/utils';
import { isS3Available, uploadBufferToS3WithPath } from '@/lib/utils/s3';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const aiReelId = url.searchParams.get('aiReelId');
    const step = url.searchParams.get('step'); // 'image' or 'video'

    if (!aiReelId || !step) {
      return NextResponse.json({ error: 'Missing aiReelId or step' }, { status: 400 });
    }

    const body: any = await req.json().catch(() => ({}));
    console.log('Kie webhook raw:', { aiReelId, step, body });

    const aiReel = await prisma.orderAiReel.findUnique({
      where: { id: aiReelId },
      include: {
        order: {
          include: {
            realtor: {
              select: {
                firstName: true, lastName: true, phone: true,
                headshot: true, companyLogo: true,
              },
            },
          },
        },
      },
    });

    if (!aiReel) {
      console.warn('Kie webhook: AI reel not found', aiReelId);
      return NextResponse.json({ error: 'AI reel not found' }, { status: 404 });
    }

    // Determine success/failure from Kie callback payload
    // Kie.ai returns output URLs inside data.resultJson (a JSON string)
    // Image tasks: {"resultUrls":["https://..."]}
    // Video tasks: may use different keys like resultUrl, videoUrl, etc.
    let outputUrl: string | undefined;
    if (body?.data?.resultJson) {
      try {
        const parsed = typeof body.data.resultJson === 'string'
          ? JSON.parse(body.data.resultJson)
          : body.data.resultJson;
        console.log('Kie webhook parsed resultJson:', parsed);
        outputUrl = parsed?.resultUrls?.[0]
          || parsed?.resultUrl
          || parsed?.videoUrl
          || parsed?.videoUrls?.[0]
          || parsed?.url
          || parsed?.output
          || parsed?.mediaUrl;
        // If parsed is a string (direct URL)
        if (!outputUrl && typeof parsed === 'string' && parsed.startsWith('http')) {
          outputUrl = parsed;
        }
      } catch { /* ignore parse error */ }
    }
    // Veo video callbacks return the URL inside data.info object
    if (!outputUrl && body?.data?.info) {
      const info = body.data.info;
      console.log('Kie webhook data.info:', JSON.stringify(info));
      outputUrl = info?.videoUrl || info?.url || info?.resultUrl
        || info?.mediaUrl || info?.resultUrls?.[0] || info?.videoUrls?.[0]
        || info?.output;
      // If info has a nested results/videos array
      if (!outputUrl && Array.isArray(info?.videos)) outputUrl = info.videos[0]?.url || info.videos[0];
      if (!outputUrl && Array.isArray(info?.results)) outputUrl = info.results[0]?.url || info.results[0];
    }
    // Fallback to other common fields on the data object itself
    if (!outputUrl) {
      outputUrl = body?.data?.resultUrl || body?.data?.videoUrl || body?.data?.output || body?.output || body?.data?.url || body?.url || body?.data?.result;
    }
    console.log('Kie webhook extracted outputUrl:', outputUrl);
    const taskStatus = (body?.data?.state || body?.data?.status || body?.status || '').toLowerCase();
    const isFailed = taskStatus.includes('fail') || taskStatus.includes('error') || (body?.code && body.code !== 200 && !outputUrl);

    if (step === 'image') {
      return await handleImageCallback(aiReel, outputUrl, isFailed, body);
    } else if (step === 'video') {
      return await handleVideoCallback(aiReel, outputUrl, isFailed, body, req);
    }

    return NextResponse.json({ error: 'Unknown step' }, { status: 400 });
  } catch (e) {
    console.error('Kie webhook error:', e);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}

async function handleImageCallback(aiReel: any, outputUrl: string | undefined, isFailed: boolean, body: any) {
  if (isFailed || !outputUrl) {
    await prisma.orderAiReel.update({
      where: { id: aiReel.id },
      data: { kieImageStatus: 'FAILED', error: `Image transform failed: ${JSON.stringify(body?.data?.error || body?.msg || 'unknown')}` },
    });
    return NextResponse.json({ ok: true, step: 'image', status: 'FAILED' });
  }

  // Save twilight image to S3
  let twilightUrl = outputUrl;
  if (isS3Available()) {
    try {
      const resp = await fetch(outputUrl);
      if (resp.ok) {
        const ab = await resp.arrayBuffer();
        const buf = Buffer.from(ab);
        const basePath = `orders/${aiReel.orderId}/ai-reels`;
        const name = `twilight-${aiReel.id.slice(0, 8)}.png`;
        const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, buf, 'image/png');
        twilightUrl = fileUrl;
      }
    } catch (e) {
      console.warn('Failed to copy twilight image to S3', e);
    }
  }

  // Update record and kick off Step 2: Video generation
  await prisma.orderAiReel.update({
    where: { id: aiReel.id },
    data: { kieImageStatus: 'COMPLETE', twilightImageUrl: twilightUrl, kieVideoStatus: 'PROCESSING' },
  });

  // Build callback URL for video step
  const baseUrl = (process.env.KIE_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  const videoCallbackUrl = `${baseUrl}/api/integrations/kie/webhook?aiReelId=${aiReel.id}&step=video`;

  try {
    const { taskId } = await generateVideo(aiReel.sourceImageUrl, twilightUrl, videoCallbackUrl);
    await prisma.orderAiReel.update({
      where: { id: aiReel.id },
      data: { kieVideoTaskId: taskId },
    });
  } catch (err: any) {
    await prisma.orderAiReel.update({
      where: { id: aiReel.id },
      data: { kieVideoStatus: 'FAILED', error: `Video generation failed: ${err?.message}` },
    });
  }

  return NextResponse.json({ ok: true, step: 'image', status: 'COMPLETE' });
}

async function handleVideoCallback(aiReel: any, outputUrl: string | undefined, isFailed: boolean, body: any, req: NextRequest) {
  if (isFailed || !outputUrl) {
    await prisma.orderAiReel.update({
      where: { id: aiReel.id },
      data: { kieVideoStatus: 'FAILED', error: `Video generation failed: ${JSON.stringify(body?.data?.error || body?.msg || 'unknown')}` },
    });
    return NextResponse.json({ ok: true, step: 'video', status: 'FAILED' });
  }

  // Save video to S3
  let videoUrl = outputUrl;
  if (isS3Available()) {
    try {
      const resp = await fetch(outputUrl);
      if (resp.ok) {
        const ab = await resp.arrayBuffer();
        const buf = Buffer.from(ab);
        const basePath = `orders/${aiReel.orderId}/ai-reels`;
        const name = `transition-${aiReel.id.slice(0, 8)}.mp4`;
        const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, buf, 'video/mp4');
        videoUrl = fileUrl;
      }
    } catch (e) {
      console.warn('Failed to copy AI video to S3', e);
    }
  }

  // Update record
  await prisma.orderAiReel.update({
    where: { id: aiReel.id },
    data: { kieVideoStatus: 'COMPLETE', videoUrl, j2vStatus: 'PROCESSING' },
  });

  // Step 3: Send to JSON2Video
  const templateId = (process.env.JSON2VIDEO_TEMPLATE_ID_AI1 || '').trim();
  if (!templateId) {
    await prisma.orderAiReel.update({
      where: { id: aiReel.id },
      data: { j2vStatus: 'FAILED', error: 'JSON2VIDEO_TEMPLATE_ID_AI1 not configured' },
    });
    return NextResponse.json({ ok: true, step: 'video', status: 'COMPLETE', j2v: 'skipped' });
  }

  const order = aiReel.order;
  const rinfo = order.realtor as any;
  const street = order.propertyAddressOverride || order.propertyAddress || '';
  const city = order.propertyCityOverride || order.propertyCity || '';
  const postal = order.propertyPostalCodeOverride || order.propertyPostalCode || '';

  const merge = [
    { find: 'ADDRESS', replace: street },
    { find: 'CITY', replace: city },
    { find: 'POSTCODE', replace: postal },
    { find: 'AI_VIDEO', replace: videoUrl },
    { find: 'AGENT_PICTURE', replace: rinfo?.headshot || '' },
    { find: 'AGENT_NAME', replace: `${rinfo?.firstName || ''} ${rinfo?.lastName || ''}`.trim() },
    { find: 'AGENT_PHONE', replace: formatPhoneNumber(rinfo?.phone) },
    { find: 'AGENCY_LOGO', replace: rinfo?.companyLogo || '' },
  ];

  // Build J2V webhook URL
  const j2vWebhookUrl = buildJ2VWebhookUrl(req);

  try {
    const provider = new J2VProvider();
    const { renderId } = await provider.render({
      images: [videoUrl],
      variantKey: 'v1-9x16' as any,
      webhookUrl: j2vWebhookUrl || '',
      meta: { orderId: order.id, aiReelId: aiReel.id },
      templateId,
      merge,
    });

    await prisma.orderAiReel.update({
      where: { id: aiReel.id },
      data: { j2vRenderId: renderId },
    });
  } catch (err: any) {
    await prisma.orderAiReel.update({
      where: { id: aiReel.id },
      data: { j2vStatus: 'FAILED', error: `J2V render failed: ${err?.message}` },
    });
  }

  return NextResponse.json({ ok: true, step: 'video', status: 'COMPLETE' });
}

function buildJ2VWebhookUrl(req: NextRequest): string | undefined {
  const explicitWebhook = process.env.JSON2VIDEO_WEBHOOK_URL?.trim();
  const token = process.env.JSON2VIDEO_WEBHOOK_TOKEN;

  if (explicitWebhook) {
    const hasPath = /\/api\/integrations\/json2video\/webhook(\?|$)/i.test(explicitWebhook);
    let url = hasPath ? explicitWebhook : `${explicitWebhook.replace(/\/$/, '')}/api/integrations/json2video/webhook`;
    if (token) url += (url.includes('?') ? '&' : '?') + `token=${token}`;
    return url;
  }

  // Use KIE_WEBHOOK_URL or NEXT_PUBLIC_APP_URL as the base (not req.headers,
  // since this runs inside a Kie.ai callback where host header is from Kie's servers)
  const base = (
    process.env.KIE_WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ''
  ).replace(/\/$/, '');

  if (!base) return undefined;
  let url = `${base}/api/integrations/json2video/webhook`;
  if (token) url += `?token=${token}`;
  return url;
}
