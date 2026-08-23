import {
  renderMediaOnLambda,
  renderStillOnLambda,
  getRenderProgress,
  type RenderMediaOnLambdaInput,
  type RenderMediaOnLambdaOutput,
  type RenderStillOnLambdaInput,
  type GetRenderProgressInput,
  type RenderProgress,
  type AwsRegion,
} from '@remotion/lambda/client';
import type { RenderPayload, RenderResult, VideoProvider, WebhookEvent } from './provider-interface';

export const VARIANT_COMPOSITION: Record<string, string> = {
  'v1-9x16': 'ReelV1',
  'v2-9x16': 'ReelV2',
  'v3-9x16': 'ReelV3',
  'v4-9x16': 'ReelV4',
  'v5-9x16': 'ReelV5',
  'v6-9x16': 'ReelV6',
  'v7-9x16': 'ReelV7',
  'v8-9x16': 'ReelV8',
  'v9-9x16': 'ReelV9',
  'v10-9x16': 'ReelV10',
  'v11-9x16': 'ReelV11',
  'v12-9x16': 'ReelV12',
  'v13-9x16': 'ReelV13',
  'v14-9x16': 'ReelV14',
  'v15-9x16': 'ReelV15',
  'v16-9x16': 'ReelV16',
  'v17-9x16': 'ReelV17',
  'h1-16x9': 'SlideshowH1',
  'h2-16x9': 'SlideshowH2',
  'h3-16x9': 'SlideshowH3',
  'h4-16x9': 'SlideshowH4',
};

function dimsForVariant(variant: string): { width: number; height: number } {
  switch (variant) {
    case 'v1-9x16':
    case 'v2-9x16':
    case 'v3-9x16':
    case 'v4-9x16':
    case 'v5-9x16':
    case 'v6-9x16':
    case 'v7-9x16':
    case 'v8-9x16':
    case 'v9-9x16':
    case 'v10-9x16':
    case 'v11-9x16':
    case 'v12-9x16':
    case 'v13-9x16':
    case 'v14-9x16':
    case 'v15-9x16':
    case 'v16-9x16':
    case 'v17-9x16':
      return { width: 1080, height: 1920 };
    case 'h1-16x9':
    case 'h2-16x9':
    case 'h3-16x9':
    case 'h4-16x9':
    default:
      return { width: 1920, height: 1080 };
  }
}

// Pass listing stats through unchanged so formats like "2+1", "2.5", or "1,530"
// survive JSON serialization. NaN/null/undefined become undefined (omitted).
function toStatValue(v: unknown): string | number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

// Build the Remotion inputProps from a render meta object. Shared by the video
// render and the thumbnail still render so both use identical props.
export function buildInputProps(
  images: string[],
  variantKey: string,
  meta: Record<string, unknown> | undefined
): Record<string, unknown> {
  return {
    images,
    variantKey,
    property: {
      address: (meta as any)?.address || '',
      street: (meta as any)?.street || '',
      city: (meta as any)?.city || '',
      postalCode: (meta as any)?.postalCode || '',
      province: (meta as any)?.province || '',
      bedrooms: toStatValue((meta as any)?.bedrooms),
      bathrooms: toStatValue((meta as any)?.bathrooms),
      sqft: toStatValue((meta as any)?.sqft) || undefined,
    },
    realtor: {
      name: (meta as any)?.realtorName || '',
      phone: (meta as any)?.realtorPhone || '',
      headshotUrl: (meta as any)?.realtorHeadshot || '',
      logoUrl: (meta as any)?.realtorLogo || '',
    },
    musicTrackUrl: (meta as any)?.musicTrackUrl || undefined,
  };
}

function lambdaConfig() {
  const region = process.env.REMOTION_AWS_REGION || 'ca-central-1';
  const functionName = process.env.REMOTION_FUNCTION_NAME?.trim();
  const serveUrl = process.env.REMOTION_SERVE_URL?.trim();
  const accessKeyId = process.env.REMOTION_AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.REMOTION_AWS_SECRET_ACCESS_KEY?.trim();

  if (!functionName) throw new Error('Missing REMOTION_FUNCTION_NAME');
  if (!serveUrl) throw new Error('Missing REMOTION_SERVE_URL');
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Missing REMOTION_AWS_ACCESS_KEY_ID / REMOTION_AWS_SECRET_ACCESS_KEY');
  }
  return { region, functionName, serveUrl };
}

export class RemotionProvider implements VideoProvider {
  private region: AwsRegion;
  private functionName: string;
  private serveUrl: string;

  constructor() {
    const cfg = lambdaConfig();
    this.region = cfg.region as AwsRegion;
    this.functionName = cfg.functionName;
    this.serveUrl = cfg.serveUrl;
  }

  async render(payload: RenderPayload): Promise<RenderResult> {
    const { images, variantKey, webhookUrl, meta } = payload as any;

    const composition = VARIANT_COMPOSITION[variantKey];
    if (!composition) {
      throw new Error(`Remotion: no composition for variantKey ${variantKey}`);
    }

    // inputProps shape mirrors remotion/lib/types.ts reelPropsSchema / slideshowPropsSchema
    const inputProps = buildInputProps(images, variantKey, meta as Record<string, unknown> | undefined);

    // Optional: direct write to your own S3 bucket (requires the Lambda role to
    // have PutObject on that bucket). Leave unset — output lands in Remotion's
    // bucket and the webhook copies it into photos4remedia instead.
    const outputBucket = process.env.REMOTION_OUTPUT_BUCKET?.trim();
    const outName = outputBucket
      ? {
          bucketName: outputBucket,
          key: `orders/${meta?.orderId || 'unknown'}/reels/videos/${variantKey}-${Date.now()}.mp4`,
        }
      : undefined;

    const webhookSecret = process.env.REMOTION_WEBHOOK_TOKEN?.trim();

    const input: RenderMediaOnLambdaInput = {
      functionName: this.functionName,
      region: this.region,
      serveUrl: this.serveUrl,
      composition,
      inputProps,
      codec: 'h264',
      imageFormat: 'jpeg',
      jpegQuality: 90,
      crf: 15,
      x264Preset: 'slower',
      maxRetries: 1,
      privacy: 'public',
      outName,
      webhook: webhookUrl
        ? {
            url: webhookUrl,
            secret: webhookSecret || null,
          }
        : undefined,
    };

    const res: RenderMediaOnLambdaOutput = await renderMediaOnLambda(input);

    return { renderId: res.renderId };
  }

  // Render a single frame (thumbnail) with the same Lambda pipeline used for the
  // video. Used instead of ffmpeg, which is unavailable in Vercel serverless.
  async renderThumbnail(
    composition: string,
    inputProps: Record<string, unknown>,
    frame: number
  ): Promise<Buffer> {
    const input: RenderStillOnLambdaInput = {
      functionName: this.functionName,
      region: this.region,
      serveUrl: this.serveUrl,
      composition,
      inputProps,
      imageFormat: 'jpeg',
      frame,
      privacy: 'public',
    };
    const res = await renderStillOnLambda(input);
    const resp = await fetch(res.url);
    if (!resp.ok) {
      throw new Error(`Failed to fetch rendered thumbnail: ${resp.status}`);
    }
    return Buffer.from(await resp.arrayBuffer());
  }

  async getStatus(renderId: string): Promise<WebhookEvent> {
    const bucketName = process.env.REMOTION_BUCKET_NAME?.trim();
    if (!bucketName) {
      throw new Error('Missing REMOTION_BUCKET_NAME');
    }
    const input: GetRenderProgressInput = {
      functionName: this.functionName,
      region: this.region,
      bucketName,
      renderId,
    };
    const progress: RenderProgress = await getRenderProgress(input);

    const status = progress.done
      ? 'done'
      : progress.fatalErrorEncountered
        ? 'failed'
        : 'rendering';

    return {
      renderId,
      status,
      url: progress.outputFile || undefined,
      error: status === 'failed' ? (progress.errors?.[0]?.message || 'Render failed') : undefined,
    };
  }

  async parseWebhook(req: Request): Promise<WebhookEvent> {
    const raw: any = await (req.json().catch(() => ({})));
    // Remotion custom webhook payload: { type: 'webhook', renderId, time, body: {...} }
    // body.type is 'success' | 'error' | 'timeout'
    const body: any = raw?.body || raw || {};
    const renderId: string = raw?.renderId || body?.renderId || '';

    if (!renderId) {
      throw new Error('Remotion webhook: missing renderId');
    }

    // Extract the first real error message so failures are diagnosable in the UI.
    const errors: any[] = Array.isArray(body?.lambdaErrors) ? body.lambdaErrors : [];
    const firstError = errors.find((e) => e?.message);
    const error = firstError?.message
      ? String(firstError.message).slice(0, 2000)
      : undefined;

    if (body?.type === 'error' || body?.type === 'timeout' || errors.length > 0) {
      return { renderId, status: 'failed', error };
    }
    if (body?.type === 'success') {
      return {
        renderId,
        status: 'done',
        url: body?.outputUrl || body?.outputFile || undefined,
      };
    }
    return { renderId, status: 'rendering' };
  }
}

export { dimsForVariant };
