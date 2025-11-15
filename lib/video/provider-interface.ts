export type RenderResult = { renderId: string };

export type WebhookEvent = {
  renderId: string;
  status: string; // provider native status, e.g. queued|rendering|done|failed
  url?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
};

export interface VideoProvider {
  render(payload: unknown): Promise<RenderResult>;
  getStatus(renderId: string): Promise<WebhookEvent>;
  parseWebhook(req: Request): Promise<WebhookEvent>;
}

export type ShotVariant =
  | 'v1-9x16'  // legacy timeline or new Vertical 1 (backward-compatible)
  | 'v1-1x1'   // legacy
  | 'v1-16x9'  // legacy
  | 'v2-16x9'  // legacy template-based horizontal
  | 'v2-9x16'  // Vertical 2 For Sale (template V2) or legacy template-based vertical
  | 'h1-16x9'  // Horizontal 1 Slideshow (template H1)
;

export type TemplateMerge = { find: string; replace: string };

export type RenderPayload = {
  images: string[]; // ordered URLs
  variantKey: ShotVariant;
  webhookUrl: string;
  meta?: Record<string, unknown>;
  // If provided, provider should render via Template API instead of direct timeline
  templateId?: string;
  merge?: TemplateMerge[];
};

