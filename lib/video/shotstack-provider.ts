import type { RenderPayload, RenderResult, VideoProvider, WebhookEvent } from './provider-interface';

function normalizeEnv(env?: string): 'stage' | 'v1' {
  const v = (env || '').toLowerCase();
  if (v === 'sandbox' || v === 'stage' || v === 'staging') return 'stage';
  return 'v1'; // production
}

function dimsForVariant(variant: string): { width: number; height: number } {
  switch (variant) {
    case 'v1-9x16': // legacy & Vertical 1
    case 'v2-9x16': // Vertical 2
      return { width: 1080, height: 1920 };
    case 'v1-1x1':
      return { width: 1080, height: 1080 };
    case 'v1-16x9':
    case 'v2-16x9':
    case 'h1-16x9': // Horizontal 1
    default:
      return { width: 1920, height: 1080 };
  }
}

export class ShotstackProvider implements VideoProvider {
  private apiKey: string;
  private baseUrl: string;

  private serveBaseUrl: string;

  constructor() {
    const key = process.env.SHOTSTACK_API_KEY;
    if (!key) throw new Error('Missing SHOTSTACK_API_KEY');
    const env = normalizeEnv(process.env.SHOTSTACK_ENV);
    this.apiKey = key;
    // Use the Edit API base, then add /{env}/render
    this.baseUrl = `https://api.shotstack.io/edit/${env}`; // e.g. /edit/stage or /edit/v1
    // Serve API base for asset management (delete, lookup by render id)
    this.serveBaseUrl = `https://api.shotstack.io/serve/${env}`;
  }

  async render(payload: RenderPayload): Promise<RenderResult> {
    const { images, variantKey, webhookUrl, meta, templateId, merge } = payload as any;

    // If a templateId is provided, use the Template API path
    if (templateId) {
      const body: any = { id: templateId };
      if (Array.isArray(merge) && merge.length) body.merge = merge;
      if (webhookUrl && /^https?:\/\//.test(webhookUrl) && !/localhost|127\.0\.0\.1/.test(webhookUrl)) {
        body.callback = webhookUrl;
      }

      // Lightweight debug to help diagnose template env/key issues
      try {
        // do not log secrets; only meta diagnostics
        console.log('Shotstack template render request', {
          url: `${this.baseUrl}/templates/render`,
          hasCallback: !!body.callback,
          mergeCount: Array.isArray(body.merge) ? body.merge.length : 0,
        });
      } catch {}

      const res = await fetch(`${this.baseUrl}/templates/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.warn('Shotstack templates render error', { code: res.status, body: txt });
        throw new Error(`Shotstack templates render error: ${res.status} ${txt}`);
      }
      const json = await res.json();
      const renderId = json?.response?.id || json?.id || json?.data?.id;
      console.log('Shotstack template render accepted', { renderId, hasId: !!renderId });
      if (!renderId) throw new Error('Shotstack: missing render id in response');
      return { renderId };
    }

    if (!images?.length) throw new Error('No images provided');

    const { width, height } = dimsForVariant(variantKey);

    // Build background slideshow (softer zoom)
    let time = 0;
    const secondsPerImage = 3.5; // 10-21s for 3-6 images
    const bgClips = images.map((src: string) => {
      const start = time;
      const length = secondsPerImage;
      time += length;
      return {
        asset: { type: 'image', src },
        start,
        length,
        effect: 'zoomInSlow', // softer zoom
        scale: 1.0,
        position: 'center',
        transition: { in: 'fade', out: 'fade' },
      } as any;
    });

    // Intro overlays: "Check Out My New Listing" word-by-word
    const introWords = ['Check', 'Out', 'My', 'New', 'Listing'];
    const wordDur = 0.5; // 0.5s per word
    const introClips = introWords.map((w, i) => ({
      asset: { type: 'title', text: w, style: 'minimal', color: '#ffffff' },
      start: i * wordDur,
      length: wordDur,
      transition: { in: 'fade', out: 'fade' },
      position: 'center',
    }));

    // Address overlay (after intro)
    const address: string | undefined = (meta?.address as string) || undefined;
    const addressStart = introWords.length * wordDur;
    const addressClip = address
      ? [{
          asset: { type: 'title', text: address, style: 'minimal', color: '#ffffff' },
          start: addressStart,
          length: 2.5,
          transition: { in: 'fade', out: 'fade' },
          position: 'center',
        }]
      : [];

    // Outro (end): headshot (1.5s) -> logo (1.5s) with phone text across both
    const outroStart = time;
    const headshot: string | undefined = (meta?.realtorHeadshot as string) || undefined;
    const logo: string | undefined = (meta?.realtorLogo as string) || undefined;
    const phone: string | undefined = (meta?.realtorPhone as string) || undefined;

    const outroClips: any[] = [];
    if (headshot) {
      outroClips.push({
        asset: { type: 'image', src: headshot },
        start: outroStart,
        length: 1.5,
        transition: { in: 'fade', out: 'fade' },
        position: 'center',
        scale: 0.8,
      });
    }
    if (logo) {
      outroClips.push({
        asset: { type: 'image', src: logo },
        start: outroStart + 1.5,
        length: 1.5,
        transition: { in: 'fade', out: 'fade' },
        position: 'center',
        scale: 0.8,
      });
    }
    if (phone) {
      outroClips.push({
        asset: { type: 'title', text: phone, style: 'minimal', color: '#ffffff' },
        start: outroStart,
        length: 3.0,
        transition: { in: 'fade', out: 'fade' },
        position: 'bottom',
      });
    }

    const tracks: any[] = [
      { clips: bgClips },
      { clips: [...introClips, ...addressClip] },
    ];
    if (outroClips.length) tracks.push({ clips: outroClips });

    const body: any = {
      timeline: {
        background: '#000000',
        tracks,
      },
      output: {
        format: 'mp4',
        fps: 30,
        size: { width, height },
      },
    };

    // Only include callback if it looks publicly reachable (Shotstack rejects localhost)
    if (webhookUrl && /^https?:\/\//.test(webhookUrl) && !/localhost|127\.0\.0\.1/.test(webhookUrl)) {
      body.callback = webhookUrl;
    }

    const res = await fetch(`${this.baseUrl}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Shotstack render error: ${res.status} ${txt}`);
    }
    const json = await res.json();
    const renderId = json?.response?.id || json?.id || json?.data?.id;
    if (!renderId) throw new Error('Shotstack: missing render id in response');
    return { renderId };
  }

  async getStatus(renderId: string): Promise<WebhookEvent> {
    // First try the Edit API status endpoint
    const res = await fetch(`${this.baseUrl}/render/${renderId}`, {
      headers: { 'x-api-key': this.apiKey, Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      const status = json?.response?.status || json?.status;
      const url = json?.response?.output?.url || json?.output?.url;
      const thumbnail = json?.response?.output?.poster || json?.response?.output?.thumbnail || json?.output?.poster;
      const width = json?.response?.output?.size?.width || json?.output?.size?.width;
      const height = json?.response?.output?.size?.height || json?.output?.size?.height;
      const duration = json?.response?.output?.duration || json?.output?.duration;
      return { renderId, status, url, thumbnail, width, height, duration };
    }

    // If the Edit API returned an error (e.g., 400), attempt a Serve API fallback to locate assets by renderId
    const errTxt = await res.text().catch(() => '');
    // console.warn is fine – surface details for debugging
    console.warn('Shotstack Edit status failed', { code: res.status, body: errTxt, renderId });

    try {
      // Try multiple Serve API patterns to locate assets by renderId
      const serveCandidates = [
        `${this.serveBaseUrl}/assets/render/${renderId}`,
        `${this.serveBaseUrl}/assets?renderId=${encodeURIComponent(renderId)}`,
        `${this.serveBaseUrl}/assets?filter=${encodeURIComponent(`render:${renderId}`)}`,
      ];

      for (const urlToTry of serveCandidates) {
        try {
          const serve = await fetch(urlToTry, {
            headers: { 'x-api-key': this.apiKey, Accept: 'application/json' },
          });
          if (!serve.ok) continue;
          const sjson: any = await serve.json().catch(() => ({}));
          const data = (sjson?.data || sjson?.response || []) as any[];
          const items = Array.isArray(data) ? data : data ? [data] : [];
          // Heuristic: find an MP4/video URL and a thumbnail/poster if present
          let url: string | undefined;
          let thumbnail: string | undefined;
          let width: number | undefined;
          let height: number | undefined;

          for (const it of items) {
            const attrs = it?.attributes || it;
            const candidates = [attrs?.url, attrs?.href, attrs?.src, it?.url, it?.href, it?.src].filter(Boolean);
            for (const c of candidates) {
              if (typeof c === 'string' && /^https?:\/\//.test(c) && /\.mp4(\?|$)/i.test(c)) {
                url = c;
                break;
              }
            }
            if (!thumbnail) {
              const thumbs = [attrs?.thumbnail, attrs?.poster, attrs?.image, attrs?.preview].filter(Boolean);
              const t = thumbs.find((t: any) => typeof t === 'string' && /^https?:\/\//.test(t));
              if (t) thumbnail = t as string;
            }
            if (!width && (attrs?.width || attrs?.size?.width)) width = (attrs?.width || attrs?.size?.width) as number;
            if (!height && (attrs?.height || attrs?.size?.height)) height = (attrs?.height || attrs?.size?.height) as number;
            if (url && thumbnail && width && height) break;
          }

          if (url) {
            // If we can find a video URL via Serve, assume COMPLETE
            return { renderId, status: 'COMPLETE', url, thumbnail, width, height };
          }
        } catch (inner) {
          console.warn('Shotstack Serve lookup attempt failed', { renderId, urlToTry, inner });
        }
      }
    } catch (e) {
      console.warn('Shotstack Serve lookup failed', { renderId, e });
    }

    throw new Error(`Shotstack status error: ${res.status}${errTxt ? ` ${errTxt}` : ''}`);
  }


  // Try Serve API to locate final CDN asset for a renderId
  private async findServeAsset(renderId: string): Promise<Partial<WebhookEvent> | undefined> {
    try {
      const serveCandidates = [
        `${this.serveBaseUrl}/assets/render/${renderId}`,
        `${this.serveBaseUrl}/assets?renderId=${encodeURIComponent(renderId)}`,
        `${this.serveBaseUrl}/assets?filter=${encodeURIComponent(`render:${renderId}`)}`,
      ];
      for (const urlToTry of serveCandidates) {
        try {
          const serve = await fetch(urlToTry, {
            headers: { 'x-api-key': this.apiKey, Accept: 'application/json' },
          });
          if (!serve.ok) continue;
          const sjson: any = await serve.json().catch(() => ({}));
          const data = (sjson?.data || sjson?.response || []) as any[];
          const items = Array.isArray(data) ? data : data ? [data] : [];
          let url: string | undefined;
          let thumbnail: string | undefined;
          let width: number | undefined;
          let height: number | undefined;
          for (const it of items) {
            const attrs = (it as any)?.attributes || it;
            const candidates = [attrs?.url, attrs?.href, attrs?.src, (it as any)?.url, (it as any)?.href, (it as any)?.src].filter(Boolean);
            for (const c of candidates) {
              if (typeof c === 'string' && /^https?:\/\//.test(c) && /\.mp4(\?|$)/i.test(c)) {
                url = c;
                break;
              }
            }
            if (!thumbnail) {
              const thumbs = [attrs?.thumbnail, attrs?.poster, attrs?.image, attrs?.preview].filter(Boolean);
              const t = thumbs.find((t: any) => typeof t === 'string' && /^https?:\/\//.test(t));
              if (t) thumbnail = t as string;
            }
            if (!width && (attrs?.width || attrs?.size?.width)) width = (attrs?.width || attrs?.size?.width) as number;
            if (!height && (attrs?.height || attrs?.size?.height)) height = (attrs?.height || attrs?.size?.height) as number;
            if (url && thumbnail && width && height) break;
          }
          if (url) return { renderId, status: 'COMPLETE', url, thumbnail, width, height } as Partial<WebhookEvent>;
        } catch (inner) {
          console.warn('Shotstack Serve lookup attempt failed', { renderId, urlToTry, inner });
        }
      }
    } catch (e) {
      console.warn('Shotstack Serve lookup failed', { renderId, e });
    }
    return undefined;
  }

  // Robust status that augments Edit status with Serve lookup when URL is missing
  async getStatusRobust(renderId: string): Promise<WebhookEvent> {
    try {
      const st = await this.getStatus(renderId);
      if (st?.url) return st;
      const serve = await this.findServeAsset(renderId);
      if (serve?.url) {
        return {
          renderId,
          status: 'COMPLETE',
          url: serve.url,
          thumbnail: serve.thumbnail,
          width: serve.width as number | undefined,
          height: serve.height as number | undefined,
        } as WebhookEvent;
      }
      return st; // likely RENDERING without URL
    } catch (e) {
      const serve = await this.findServeAsset(renderId);
      if (serve?.url) {
        return {
          renderId,
          status: 'COMPLETE',
          url: serve.url,
          thumbnail: serve.thumbnail,
          width: serve.width as number | undefined,
          height: serve.height as number | undefined,
        } as WebhookEvent;
      }
      throw e;
    }
  }

  async parseWebhook(req: Request): Promise<WebhookEvent> {
    const body = await req.json().catch(() => ({}));
    const type = body?.type as string | undefined; // 'edit' or 'serve'
    // Shotstack posts { response: { id, status, output: { url, poster, size, duration } } } for Edit,
    // and { type: 'serve', action: 'copy', id: <assetId>, render: <renderId>, url: <cdn url> } for Serve
    let renderId = body?.response?.id || body?.id || body?.data?.id;
    const status = body?.response?.status || body?.status || body?.data?.status;

    // Try multiple locations for url & thumbnail as providers sometimes vary payload shapes
    let url = body?.response?.output?.url || body?.output?.url;
    const thumbnail = body?.response?.output?.poster || body?.response?.output?.thumbnail || body?.output?.poster;
    const width = body?.response?.output?.size?.width || body?.output?.size?.width;
    const height = body?.response?.output?.size?.height || body?.output?.size?.height;
    const duration = body?.response?.output?.duration || body?.output?.duration;

    // Fallbacks: sometimes url can be at response.url or url
    if (!url && typeof body?.response?.url === 'string') url = body.response.url;
    if (!url && typeof body?.url === 'string') url = body.url;

    // Serve events use 'render' to reference the original Edit render id
    if (type === 'serve' && typeof body?.render === 'string') {
      renderId = body.render;
    }

    if (!renderId) throw new Error('Webhook missing render id');
    return { renderId, status, url, thumbnail, width, height, duration };
  }

  /**
   * Delete hosted assets for a render via Serve API and ignore errors if not found.
   * This attempts to find all assets associated with a renderId and delete them.
   */
  async deleteByRenderId(renderId: string): Promise<void> {
    if (!renderId || renderId === 'pending') return;

    // Lookup assets by render ID
    const res = await fetch(`${this.serveBaseUrl}/assets/render/${renderId}`, {
      headers: { 'x-api-key': this.apiKey, Accept: 'application/json' },
    });

    if (!res.ok) {
      // If not found, nothing to delete
      return;
    }

    const json = await res.json().catch(() => ({} as any));
    const data = (json && (json.data || json.response || [])) as any;
    const items: any[] = Array.isArray(data) ? data : data ? [data] : [];

    const ids: string[] = items
      .map((it) => (it?.id ? it.id : it?.attributes?.id))
      .filter(Boolean);

    for (const id of ids) {
      try {
        await fetch(`${this.serveBaseUrl}/assets/${id}`, {
          method: 'DELETE',
          headers: { 'x-api-key': this.apiKey, Accept: 'application/json' },
        });
      } catch {
        // ignore
      }
    }
  }
}

