'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';

interface Video {
  id: string;
  url: string;
  filename: string;
}

export function VideosGrid({
  orderId,
  refreshToken = 0,
}: {
  orderId: string;
  refreshToken?: number;
}) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/media/videos`);
      if (res.ok) setVideos(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [orderId, refreshToken]);
  useEffect(() => {
    setSelected({});
  }, [orderId, refreshToken]);

  async function removeMany(ids: string[]) {
    setDeleting('bulk');
    try {
      await fetch(`/api/orders/${orderId}/media/videos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      setVideos((p) => p.filter((x) => !ids.includes(x.id)));
      setSelected({});
    } finally {
      setDeleting(null);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/orders/${orderId}/media/videos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      setVideos((p) => p.filter((x) => x.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  if (loading)
    return (
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading videos...
      </div>
    );

  if (!videos.length)
    return <div className="text-sm text-gray-500">No videos yet</div>;

  const allSelected = videos.length > 0 && selectedIds.length === videos.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={allSelected}
            onChange={(e) => {
              if (e.target.checked)
                setSelected(
                  Object.fromEntries(videos.map((v) => [v.id, true]))
                );
              else setSelected({});
            }}
          />
          <span className="text-sm text-gray-600">
            {selectedIds.length} selected
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelected({})}
            disabled={!selectedIds.length}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => removeMany(selectedIds)}
            disabled={!selectedIds.length || deleting !== null}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />{' '}
                <span className="hidden sm:inline">Delete selected</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {videos.map((v) => (
          <div
            key={v.id}
            className={`relative group border rounded-md overflow-hidden ${
              selected[v.id] ? 'ring-2 ring-primary' : ''
            }`}
          >
            <video
              controls
              className="w-full h-48 object-cover"
              onClick={() => setSelected((s) => ({ ...s, [v.id]: !s[v.id] }))}
            >
              <source src={v.url} type="video/mp4" />
            </video>
            <input
              type="checkbox"
              className="absolute top-2 left-2 h-4 w-4 bg-white/80"
              checked={!!selected[v.id]}
              onChange={(e) =>
                setSelected((s) => ({ ...s, [v.id]: e.target.checked }))
              }
            />
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition">
              <Button
                size="icon"
                variant="outline"
                onClick={() => remove(v.id)}
                disabled={deleting === v.id}
              >
                {deleting === v.id ? (
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
