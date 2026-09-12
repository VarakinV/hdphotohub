'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, RotateCcw, Download } from 'lucide-react';
import { DeleteIconButton } from '@/components/admin/ui/icon-action';
import { toast } from 'sonner';

function statusColor(s: string) {
  switch (s) {
    case 'COMPLETE':
      return 'bg-[#e4f4ea] dark:bg-[#123322] text-[#1c7a41] dark:text-[#7fe0a3]';
    case 'RENDERING':
      return 'bg-blue-100 text-blue-800';
    case 'QUEUED':
      return 'bg-yellow-100 text-[#9a6a12] dark:text-[#f0c674]';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-surface-2 text-foreground';
  }
}

function prettyVariant(v: string) {
  return v.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SocialPostsList({
  orderId,
  refreshToken = 0,
}: {
  orderId: string;
  refreshToken?: number;
}) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/social-posts`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load posts');
      setPosts(json);
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
    () => posts.some((p) => p.status === 'QUEUED' || p.status === 'RENDERING'),
    [posts]
  );
  useEffect(() => {
    if (!hasActive) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActive]);

  const onRender = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/social-posts/${id}/render`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Render failed');
      toast.success('Post generation started');
      await load();
    } catch (e: any) {
      toast.error(e.message || String(e));
    }
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/orders/${orderId}/social-posts/${id}/delete`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Delete failed');
      toast.success('Post deleted');
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
        <div className="font-medium">Social Media Posts</div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {posts.length === 0 && (
          <div className="col-span-full text-sm text-muted-foreground">
            No posts yet. Click <strong>Generate Posts</strong> to create them.
          </div>
        )}
        {posts.map((p) => (
          <div key={p.id} className="border rounded-md overflow-hidden bg-card flex flex-col">
            <div className="relative bg-surface-2 aspect-[4/5] flex items-center justify-center">
              {p.status === 'COMPLETE' && p.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt={p.variantKey} className="w-full h-full object-cover" />
              ) : p.status === 'FAILED' ? (
                <div className="text-xs text-[#c23434] dark:text-[#f09a9a] p-3 text-center">
                  Failed
                  {p.error ? <div className="text-[10px] text-red-500 mt-1">{p.error}</div> : null}
                </div>
              ) : (
                <div className="flex flex-col items-center text-xs text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mb-1" />
                  {p.status}
                </div>
              )}
            </div>
            <div className="p-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="text-xs font-medium truncate">{prettyVariant(p.variantKey)}</div>
                <span className={`px-1.5 py-0.5 text-[10px] rounded ${statusColor(p.status)}`}>{p.status}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {p.status === 'COMPLETE' && p.url ? (
                  <Button size="sm" variant="outline" asChild className="h-7 text-xs flex-1">
                    <a href={p.url} target="_blank" rel="noreferrer">
                      <Download className="h-3 w-3 mr-1" /> Download
                    </a>
                  </Button>
                ) : null}
                {(p.status === 'COMPLETE' || p.status === 'FAILED') && (
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onRender(p.id)} title="Regenerate">
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
                <DeleteIconButton
                  label="Delete"
                  onClick={() => onDelete(p.id)}
                  loading={deletingId === p.id}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
