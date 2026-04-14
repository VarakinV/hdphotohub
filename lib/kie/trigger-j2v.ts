import { prisma } from '@/lib/db/prisma';
import { J2VProvider } from '@/lib/video/j2v-provider';
import { formatPhoneNumber } from '@/lib/utils';

/**
 * Trigger a J2V render for an AI reel that already has a video URL.
 * Used for retrying the J2V step without going through the Kie webhook.
 */
export async function triggerJ2VRender(aiReelId: string, baseUrl: string) {
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

  if (!aiReel || !aiReel.videoUrl) {
    throw new Error('AI reel not found or missing video URL');
  }

  const templateId = (process.env.JSON2VIDEO_TEMPLATE_ID_AI1 || '').trim();
  if (!templateId) {
    await prisma.orderAiReel.update({
      where: { id: aiReelId },
      data: { j2vStatus: 'FAILED', error: 'JSON2VIDEO_TEMPLATE_ID_AI1 not configured' },
    });
    throw new Error('JSON2VIDEO_TEMPLATE_ID_AI1 not configured');
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
    { find: 'AI_VIDEO', replace: aiReel.videoUrl },
    { find: 'AGENT_PICTURE', replace: rinfo?.headshot || '' },
    { find: 'AGENT_NAME', replace: `${rinfo?.firstName || ''} ${rinfo?.lastName || ''}`.trim() },
    { find: 'AGENT_PHONE', replace: formatPhoneNumber(rinfo?.phone) },
    { find: 'AGENCY_LOGO', replace: rinfo?.companyLogo || '' },
  ];

  const token = process.env.JSON2VIDEO_WEBHOOK_TOKEN;
  let j2vWebhookUrl = `${baseUrl}/api/integrations/json2video/webhook`;
  if (token) j2vWebhookUrl += `?token=${token}`;

  const provider = new J2VProvider();
  const { renderId } = await provider.render({
    images: [aiReel.videoUrl],
    variantKey: 'v1-9x16' as any,
    webhookUrl: j2vWebhookUrl,
    meta: { orderId: order.id, aiReelId: aiReel.id },
    templateId,
    merge,
  });

  await prisma.orderAiReel.update({
    where: { id: aiReelId },
    data: { j2vStatus: 'PROCESSING', j2vRenderId: renderId, error: null },
  });
}
