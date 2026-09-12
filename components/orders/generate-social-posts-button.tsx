'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Images, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function GenerateSocialPostsButton({
  orderId,
  onStarted,
}: {
  orderId: string;
  onStarted?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [sourcesCount, setSourcesCount] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const [oRes, sRes] = await Promise.all([
        fetch(`/api/orders/${orderId}`),
        fetch(`/api/orders/${orderId}/media/reels-sources`),
      ]);
      if (oRes.ok) setOrder(await oRes.json());
      if (sRes.ok) setSourcesCount((await sRes.json()).length || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [orderId]);

  const missing: string[] = useMemo(() => {
    const m: string[] = [];
    if (!order) return m;
    if (sourcesCount < 1) m.push('At least 1 source image');
    const r = order.realtor || {};
    if (!r?.headshot) m.push('Realtor headshot');
    if (!r?.companyLogo) m.push('Brokerage logo');
    if (!r?.firstName || !r?.lastName) m.push('Realtor name');
    if (!r?.phone) m.push('Realtor phone');
    if (!order.bedrooms) m.push('Bedrooms');
    if (!order.bathrooms) m.push('Bathrooms');
    if (!order.propertySize) m.push('Size (sq ft)');
    if (!order.propertyAddress && !order.propertyFormattedAddress) m.push('Property address');
    return m;
  }, [order, sourcesCount]);

  async function handleGenerate() {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/orders/${orderId}/social-posts/generate`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to start social post generation');
      const ids: string[] = Array.isArray(data?.created) ? data.created : [];
      onStarted?.();
      if (ids.length === 0) {
        toast.info('All active social posts already exist');
        return;
      }
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      for (let i = 0; i < ids.length; i++) {
        const pid = ids[i];
        try {
          await fetch(`/api/orders/${orderId}/social-posts/${pid}/render`, { method: 'POST' });
        } catch {}
        if (i < ids.length - 1) await sleep(400);
      }
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Generation failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking requirements...
      </div>
    );
  }

  const disabled = missing.length > 0 || submitting;
  const title = disabled ? `Missing: ${missing.join(', ')}` : 'Generate all active social posts';

  return (
    <div className="pt-2">
      <Button type="button" disabled={disabled} onClick={handleGenerate} title={title}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
          </>
        ) : (
          <>
            <Images className="mr-2 h-4 w-4" /> Generate Posts
          </>
        )}
      </Button>
    </div>
  );
}
