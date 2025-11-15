import type { RenderPayload, RenderResult, VideoProvider, WebhookEvent, TemplateMerge } from './provider-interface';

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
      return { width: 1080, height: 1920 };
    case 'v1-1x1':
      return { width: 1080, height: 1080 };
    case 'v1-16x9':
    case 'v2-16x9':
    case 'h1-16x9':
    default:
      return { width: 1920, height: 1080 };
  }
}

function mergesToVariables(merge?: TemplateMerge[]): Record<string, string> | undefined {
  if (!merge || !Array.isArray(merge) || merge.length === 0) return undefined;
  const vars: Record<string, string> = {};
  for (const m of merge) {
    if (!m || typeof m.find !== 'string') continue;
    vars[m.find] = String(m.replace ?? '');
  }
  return vars;
}

export class J2VProvider implements VideoProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const key = process.env.JSON2VIDEO_API_KEY;
    if (!key) throw new Error('Missing JSON2VIDEO_API_KEY');
    this.apiKey = key;
    this.baseUrl = (process.env.JSON2VIDEO_BASE_URL || 'https://api.json2video.com/v2').replace(/\/$/, '');
  }

  async render(payload: RenderPayload): Promise<RenderResult> {
    const { variantKey, webhookUrl, templateId, merge, meta } = payload as any;

    if (!templateId) {
      throw new Error('J2V: templateId is required');
    }

    const { width, height } = dimsForVariant(variantKey);

    const variables = mergesToVariables(merge);

    // Best-effort correlation via movie.id and client-data
    const reelId = meta?.reelId || meta?.id || 'reel';

    const body: any = {
      resolution: 'custom',
      width,
      height,
      template: templateId,
      variables: variables || {},
      id: String(reelId),
      'client-data': {
        orderId: meta?.orderId || '',
        reelId: String(reelId),
        variantKey: variantKey || '',
      },
    };

    if (webhookUrl && /^https?:\/\//.test(webhookUrl)) {
      body.exports = [
        {
          destinations: [
            {
              type: 'webhook',
              endpoint: webhookUrl,
            },
          ],
        },
      ];
    }

    const res = await fetch(`${this.baseUrl}/movies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`J2V render error: ${res.status} ${txt}`);
    }

    const json: any = await res.json().catch(() => ({}));
    const renderId = json?.project || json?.movie?.project;
    if (!renderId) throw new Error('J2V: missing project id in response');
    return { renderId };
  }

  async getStatus(renderId: string): Promise<WebhookEvent> {
    const url = `${this.baseUrl}/movies?project=${encodeURIComponent(renderId)}`;
    const res = await fetch(url, { headers: { 'x-api-key': this.apiKey, Accept: 'application/json' } });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`J2V status error: ${res.status} ${txt}`);
    }
    const json: any = await res.json().catch(() => ({}));
    const movie = json?.movie || {};
    return {
      renderId,
      status: movie?.status || '',
      url: movie?.url || undefined,
      width: movie?.width || undefined,
      height: movie?.height || undefined,
      duration: movie?.duration || undefined,
    };
  }

  async parseWebhook(req: Request): Promise<WebhookEvent> {
    const body: any = await (req.json().catch(() => ({})));
    // Webhook fires after export completes; treat as done
    const renderId: string = body?.project || body?.movie?.project || '';
    const url: string | undefined = body?.url || body?.movie?.url;
    const width = body?.width ? Number(body.width) : (body?.movie?.width || undefined);
    const height = body?.height ? Number(body.height) : (body?.movie?.height || undefined);
    const duration = body?.duration ? Number(body.duration) : (body?.movie?.duration || undefined);
    return { renderId, status: url ? 'done' : 'error', url, width, height, duration };
  }
}

