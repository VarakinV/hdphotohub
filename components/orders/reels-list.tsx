'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';

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
  // Horizontal slideshows
  if (v === 'h1-16x9') return 'H1: Horizontal 1 Slideshow (16x9)';
  if (v === 'h2-16x9') return 'H2: Horizontal 2 Slideshow (16x9)';
  // Vertical reels
  if (v === 'v1-9x16') return 'Vertical Reel 1 - Just Listed';
  if (v === 'v2-9x16') return 'Vertical Reel 2 - For Sale';
  if (v === 'v3-9x16') return 'Vertical Reel 3 - For Sale';
  if (v === 'v4-9x16') return 'Vertical Reel 4 - Just Listed';
  if (v === 'v5-9x16') return 'Vertical Reel 5 - For Sale';
  if (v === 'v6-9x16') return 'Vertical Reel 6 - New On The Market';
  if (v === 'v7-9x16') return 'Seasonal 1 - For Sale';
  if (v === 'v8-9x16') return 'Seasonal 2 - New Listing';
  if (v === 'v9-9x16') return 'Seasonal 3 - For Sale';
  // Backward-compatible legacy labels (older reels)
  if (v === 'v1-1x1') return 'V1 • 1:1';
  if (v === 'v1-16x9') return 'V1 • 16:9';
  if (v === 'v2-16x9') return 'V2 • 16:9';
  return v;
}

function storageInfo(url?: string): { label: string; cls: string } | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname || '';
    if (host.includes('s3.amazonaws.com') || host.includes('.s3.')) {
      return { label: 'S3', cls: 'bg-purple-100 text-purple-800' };
    }
    if (host.includes('shotstack.io')) {
      return { label: 'Shotstack', cls: 'bg-gray-100 text-gray-800' };
    }
    if (host.includes('json2video')) {
      return { label: 'JSON2Video', cls: 'bg-gray-100 text-gray-800' };
    }
    return { label: 'External', cls: 'bg-slate-100 text-slate-800' };
  } catch {
    return null;
  }
}

export default function ReelsList({
  orderId,
  refreshToken = 0,
}: {
  orderId: string;
  refreshToken?: number;
}) {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/reels`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load');
      setReels(json);
    } catch (e: any) {
      toast.error(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [orderId]);

  const onRetry = async (rid: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/reels/${rid}/retry`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Retry failed');
      toast.success('Render re-submitted');
      await load();
    } catch (e: any) {
      toast.error(e.message || String(e));
    }
  };

  const onCancel = async (rid: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/reels/${rid}/cancel`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Cancel failed');
      toast.success('Render cancelled');
      await load();
    } catch (e: any) {
      toast.error(e.message || String(e));
    }
  };
  // Manual load and refresh triggers
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, refreshToken]);

  const hasActive = useMemo(
    () => reels.some((r) => r.status === 'QUEUED' || r.status === 'RENDERING'),
    [reels]
  );
  useEffect(() => {
    if (!hasActive) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActive]);

  // Fake fill progress bar while renders are active
  useEffect(() => {
    if (!hasActive) {
      setProgress(0);
      return;
    }
    setProgress((p) => (p < 10 ? 10 : p));
    const id = setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + 5));
    }, 400);
    return () => clearInterval(id);
  }, [hasActive]);

  // Auto background sync for stuck renders (> X minutes)
  const lastAutoSyncAt = useRef<number>(0);
  const STUCK_MINUTES = 2; // adjust as desired
  useEffect(() => {
    if (!hasActive || reels.length === 0) return;
    const now = Date.now();
    // Rate-limit auto sync to once per 60s
    if (now - lastAutoSyncAt.current < 60_000) return;
    const thresholdMs = STUCK_MINUTES * 60_000;
    const stuck = reels.some((r) => {
      if (r.status !== 'RENDERING' && r.status !== 'QUEUED') return false;
      const t = new Date(r.updatedAt || r.createdAt || Date.now()).getTime();
      return now - t > thresholdMs;
    });
    if (!stuck) return;
    (async () => {
      try {
        lastAutoSyncAt.current = now;
        await fetch(`/api/orders/${orderId}/reels/sync`, { method: 'POST' });
        await load();
      } catch {
        // ignore
      }
    })();
  }, [hasActive, reels]);

  const onDelete = async (rid: string) => {
    setDeletingId(rid);
    try {
      const res = await fetch(`/api/orders/${orderId}/reels/${rid}/delete`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Delete failed');
      toast.success('Reel deleted');
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
        <div className="font-medium">Reels</div>
        <div className="flex items-center gap-2">
          {hasActive && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              <div className="w-32 h-1 bg-gray-200 rounded overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-[width] duration-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          {hasActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/orders/${orderId}/reels/sync`, {
                    method: 'POST',
                  });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json?.error || 'Sync failed');
                  toast.success('Statuses synced');
                  await load();
                } catch (e: any) {
                  toast.error(e.message || String(e));
                }
              }}
            >
              Sync Status
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {reels.length === 0 && (
          <div className="text-sm text-gray-500">No reels yet.</div>
        )}
        {(() => {
          const orderKeys = [
            'v1-9x16',
            'v2-9x16',
            'v3-9x16',
            'v4-9x16',
            'v5-9x16',
            'v6-9x16',
            'v7-9x16',
            'v8-9x16',
            'v9-9x16',
          ];
          const idx = (k: string) => {
            const i = orderKeys.indexOf((k || '').toLowerCase());
            return i >= 0 ? i : 999;
          };
          return reels
            .slice()
            .sort((a: any, b: any) => idx(a.variantKey) - idx(b.variantKey))
            .map((r) => (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center border rounded-md px-3 py-2 gap-2"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-sm font-medium">
                    {variantLabel(r.variantKey)}
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${statusColor(
                      r.status
                    )}`}
                  >
                    {r.status}
                  </span>
                  {r.url &&
                    (() => {
                      const si = storageInfo(r.url);
                      return si ? (
                        <span
                          className={`px-2 py-0.5 text-xs rounded ${si.cls}`}
                        >
                          {si.label}
                        </span>
                      ) : null;
                    })()}
                  {r.width && r.height && (
                    <div className="text-xs text-gray-500">
                      {r.width}×{r.height}
                    </div>
                  )}
                  {r.renderId && (
                    <div className="text-xs text-gray-400">
                      ID: {r.renderId.slice(0, 8)}…
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:ml-auto">
                  {/* Actions */}
                  {r.status === 'COMPLETE' && (
                    <>
                      {/* Show only when URL is still on Shotstack */}
                      {(() => {
                        try {
                          const host = new URL(r.url || '').hostname || '';
                          const isExternalCdn =
                            host.includes('shotstack.io') ||
                            host.includes('json2video');
                          if (isExternalCdn) {
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(
                                      `/api/orders/${orderId}/reels/${r.id}/sync`,
                                      { method: 'POST' }
                                    );
                                    const json = await res.json();
                                    if (!res.ok)
                                      throw new Error(
                                        json?.error || 'Sync storage failed'
                                      );
                                    toast.success('Storage synced to S3');
                                    await load();
                                  } catch (e: any) {
                                    toast.error(e.message || String(e));
                                  }
                                }}
                              >
                                Sync Storage
                              </Button>
                            );
                          }
                        } catch {}
                        return null;
                      })()}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRetry(r.id)}
                      >
                        Regenerate
                      </Button>
                    </>
                  )}
                  {r.status === 'FAILED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRetry(r.id)}
                    >
                      Retry
                    </Button>
                  )}
                  {(r.status === 'RENDERING' || r.status === 'QUEUED') && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onCancel(r.id)}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onDelete(r.id)}
                    title="Delete"
                    disabled={deletingId === r.id}
                    aria-busy={deletingId === r.id}
                  >
                    {deletingId === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ));
        })()}
      </div>
    </div>
  );
}
