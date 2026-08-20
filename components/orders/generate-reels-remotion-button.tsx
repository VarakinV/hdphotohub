'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { RemotionMusicPicker } from '@/components/orders/remotion-music-picker';

export function GenerateReelsRemotionButton({
  orderId,
  onStarted,
  refreshToken = 0,
}: {
  orderId: string;
  onStarted?: () => void;
  refreshToken?: number;
}) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [sourcesCount, setSourcesCount] = useState(0);
  const [musicTrackId, setMusicTrackId] = useState('');

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
  }, [orderId, refreshToken]);

  const missing: string[] = useMemo(() => {
    const m: string[] = [];
    if (!order) return m;
    if (sourcesCount < 3) m.push('At least 3 reel images');
    const r = order.realtor || {};
    if (!r?.headshot) m.push('Realtor headshot');
    if (!r?.companyLogo) m.push('Brokerage logo');
    if (!r?.firstName || !r?.lastName) m.push('Realtor name');
    if (!r?.phone) m.push('Realtor phone');
    if (!order.bedrooms) m.push('Bedrooms');
    if (!order.bathrooms) m.push('Bathrooms');
    if (!order.propertyAddress && !order.propertyFormattedAddress)
      m.push('Property address');
    return m;
  }, [order, sourcesCount]);

  async function handleGenerate() {
    try {
      setSubmitting(true);
      setError('');
      setMessage('');
      const res = await fetch(`/api/orders/${orderId}/reels/generate-remotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Only send an override when a track is explicitly chosen;
        // otherwise each variant picks up its template's default music.
        body: musicTrackId ? JSON.stringify({ musicTrackId }) : '{}',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to start generation');
      if (data.alreadyExists) {
        setMessage('All active Remotion templates are already generated for this order. Delete a reel or activate another template to generate more.');
      } else {
        const created = data?.created?.length ?? 0;
        const failed = data?.failed ?? 0;
        setMessage(
          created > 0
            ? `Queued ${created} reel${created === 1 ? '' : 's'} for rendering.`
            : failed > 0
              ? `${failed} reel${failed === 1 ? '' : 's'} failed to start — check the reel list for errors.`
              : 'Generation queued.',
        );
      }
      onStarted?.();
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
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
    : 'Generate reels with Remotion';

  return (
    <div className="pt-2 space-y-2">
      <div className="text-xs text-gray-500">
        Music override (optional): leave as &quot;No music&quot; to use each template&apos;s
        default track.
      </div>
      <RemotionMusicPicker value={musicTrackId} onChange={setMusicTrackId} />
      <Button type="button" disabled={disabled} onClick={handleGenerate} title={title}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" /> Generate Reels with Remotion
          </>
        )}
      </Button>
      {missing.length > 0 && (
        <div className="text-xs text-amber-600">Missing to generate: {missing.join(', ')}.</div>
      )}
      {message && <div className="text-sm text-green-600">{message}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
