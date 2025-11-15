'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, PlaySquare } from 'lucide-react';

export function GenerateReelsJ2VButton({
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
    if (sourcesCount < 3) m.push('At least 3 reel images');
    const r = order.realtor || {};
    if (!r?.headshot) m.push('Realtor headshot');
    if (!r?.companyLogo) m.push('Brokerage logo');
    if (!r?.firstName || !r?.lastName) m.push('Realtor name');
    if (!r?.phone) m.push('Realtor phone');
    if (!order.listPrice) m.push('List price');
    if (!order.bedrooms) m.push('Bedrooms');
    if (!order.bathrooms) m.push('Bathrooms');
    if (!order.propertyAddress && !order.propertyFormattedAddress)
      m.push('Property address');
    return m;
  }, [order, sourcesCount]);

  async function handleGenerate() {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/orders/${orderId}/reels/generate-j2v`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to start generation');
      onStarted?.();
      await load();
    } catch {
      // noop
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking requirements...
      </div>
    );
  }

  const disabled = missing.length > 0 || submitting;
  const title = disabled
    ? `Missing: ${missing.join(', ')}`
    : 'Generate 3 reels (no music)';

  return (
    <div className="pt-2">
      <Button type="button" disabled={disabled} onClick={handleGenerate} title={title}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...
          </>
        ) : (
          <>
            <PlaySquare className="mr-2 h-4 w-4" /> Generate Reels with J2V
          </>
        )}
      </Button>
    </div>
  );
}

