'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

function statusColor(s: string) {
  switch (s) {
    case 'COMPLETE':
      return 'bg-green-100 text-green-800';
    case 'RENDERING':
      return 'bg-blue-100 text-blue-800';
    case 'QUEUED':
      return 'bg-yellow-100 text-yellow-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function variantLabel(v: string) {
  if (v === 'f1') return 'Flyer V1 (links to Property V1)';
  if (v === 'f2') return 'Flyer V2 (links to Property V2)';
  if (v === 'f3') return 'Flyer V3 (links to Property V3)';
  return v;
}

export default function FlyersList({
  orderId,
  refreshToken = 0,
}: {
  orderId: string;
  refreshToken?: number;
}) {
  const [flyers, setFlyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/flyers`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load flyers');
      setFlyers(json);
    } catch (e: any) {
      toast.error(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [orderId, refreshToken]);

  const hasActive = useMemo(
    () => flyers.some((f) => f.status === 'QUEUED' || f.status === 'RENDERING'),
    [flyers]
  );
  useEffect(() => {
    if (!hasActive) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActive]);

  const onRetry = async (fid: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/flyers/${fid}/retry`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Retry failed');
      toast.success('Flyer re-generated');
      await load();
    } catch (e: any) {
      toast.error(e.message || String(e));
    }
  };

  const onDelete = async (fid: string) => {
    setDeletingId(fid);
    try {
      const res = await fetch(`/api/orders/${orderId}/flyers/${fid}/delete`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Delete failed');
      toast.success('Flyer deleted');
      await load();
    } catch (e: any) {
      toast.error(e.message || String(e));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">Flyers</div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="space-y-2">
        {flyers.length === 0 && (
          <div className="text-sm text-gray-500">No flyers yet.</div>
        )}
        {flyers.map((f) => (
          <div
            key={f.id}
            className="flex flex-col sm:flex-row sm:items-center border rounded-md px-3 py-2 gap-2"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm font-medium">
                {variantLabel(f.variantKey)}
              </div>
              <span
                className={`px-2 py-0.5 text-xs rounded ${statusColor(
                  f.status
                )}`}
              >
                {f.status}
              </span>
              {f.pageWidth && f.pageHeight && (
                <div className="text-xs text-gray-500">
                  {f.pageWidth}×{f.pageHeight}
                </div>
              )}
              {f.previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.previewUrl}
                  alt="preview"
                  className="h-10 rounded border"
                />
              )}
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:ml-auto">
              {(f.status === 'COMPLETE' || f.status === 'FAILED') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRetry(f.id)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Regenerate
                </Button>
              )}
              <Button
                size="icon"
                variant="outline"
                onClick={() => onDelete(f.id)}
                title="Delete"
                disabled={deletingId === f.id}
                aria-busy={deletingId === f.id}
              >
                {deletingId === f.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
