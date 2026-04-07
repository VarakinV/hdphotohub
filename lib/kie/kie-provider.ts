/**
 * Kie.ai API client for AI image transformation and video generation.
 *
 * Step 1: Transform daytime photo → twilight using nano-banana-pro model
 * Step 2: Generate day→twilight transition video using Veo3 model
 */

const KIE_BASE_URL = 'https://api.kie.ai/api/v1';

function getApiKey(): string {
  const key = process.env.KIE_API_KEY;
  if (!key) throw new Error('Missing KIE_API_KEY environment variable');
  return key;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
  };
}

export interface KieTaskResult {
  taskId: string;
}

export interface KieTaskStatus {
  status: string; // e.g. 'pending', 'processing', 'completed', 'failed'
  output?: string; // output URL when complete
  error?: string;
}

/**
 * Step 1: Transform a daytime real estate photo into a twilight version
 * using the nano-banana-pro (image-to-image) model.
 */
export async function transformToTwilight(
  imageUrl: string,
  callbackUrl: string
): Promise<KieTaskResult> {
  const body = {
    model: 'nano-banana-pro',
    callBackUrl: callbackUrl,
    input: {
      prompt:
        'Transform this daytime real estate photo into a realistic twilight version. Keep the details of the house unchanged. Keep lighting natural, warm interior glow, and realistic sky.',
      image_input: [imageUrl],
      aspect_ratio: '4:3',
      resolution: '2K',
      output_format: 'png',
    },
  };

  const res = await fetch(`${KIE_BASE_URL}/jobs/createTask`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Kie.ai image transform error: ${res.status} ${txt}`);
  }

  const json: any = await res.json().catch(() => ({}));
  if (json.code !== 200 || !json.data?.taskId) {
    throw new Error(`Kie.ai image transform failed: ${JSON.stringify(json)}`);
  }
  return { taskId: json.data.taskId };
}

/**
 * Step 2: Generate a cinematic day-to-twilight transition video
 * using Veo3 model with REFERENCE_2_VIDEO generation type.
 */
export async function generateVideo(
  dayImageUrl: string,
  twilightImageUrl: string,
  callbackUrl: string
): Promise<KieTaskResult> {
  const body = {
    prompt:
      'Create a cinematic real estate transition video. Start with the daytime image, smoothly transition into the twilight version over 3-5 seconds. Add a subtle slow zoom effect. Duration 6-8 seconds total.',
    imageUrls: [dayImageUrl, twilightImageUrl],
    model: 'veo3_fast',
    callBackUrl: callbackUrl,
    aspect_ratio: '16:9',
    seeds: Math.floor(Math.random() * 90000) + 10000,
    generationType: 'REFERENCE_2_VIDEO',
  };

  const res = await fetch(`${KIE_BASE_URL}/veo/generate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Kie.ai video generate error: ${res.status} ${txt}`);
  }

  const json: any = await res.json().catch(() => ({}));
  if (json.code !== 200 || !json.data?.taskId) {
    throw new Error(`Kie.ai video generate failed: ${JSON.stringify(json)}`);
  }
  return { taskId: json.data.taskId };
}

/**
 * Poll task status (fallback when webhook doesn't fire).
 */
export async function getTaskStatus(taskId: string): Promise<KieTaskStatus> {
  const res = await fetch(`${KIE_BASE_URL}/jobs/getTaskStatus?taskId=${encodeURIComponent(taskId)}`, {
    method: 'GET',
    headers: headers(),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Kie.ai status error: ${res.status} ${txt}`);
  }

  const json: any = await res.json().catch(() => ({}));
  const data = json.data || {};
  return {
    status: data.status || json.status || 'unknown',
    output: data.output || data.url || data.result || undefined,
    error: data.error || undefined,
  };
}
