'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  urlMls?: string | null;
  filename: string;
}

export function PhotosGrid({
  orderId,
  refreshToken = 0,
}: {
  orderId: string;
  refreshToken?: number;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/media/photos`);
      if (res.ok) setPhotos(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [orderId, refreshToken]);

  useEffect(() => {
    // clear selections when data changes
    setSelected({});
  }, [orderId, refreshToken]);

  async function removeMany(ids: string[]) {
    setDeleting('bulk');
    try {
      await fetch(`/api/orders/${orderId}/media/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      setPhotos((p) => p.filter((x) => !ids.includes(x.id)));
      setSelected({});
    } finally {
      setDeleting(null);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/orders/${orderId}/media/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      setPhotos((p) => p.filter((x) => x.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  if (loading)
    return (
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading photos...
      </div>
    );

  if (!photos.length)
    return <div className="text-sm text-gray-500">No photos yet</div>;

  const allSelected = photos.length > 0 && selectedIds.length === photos.length;

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
                  Object.fromEntries(photos.map((p) => [p.id, true]))
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
                <Trash2 className="h-4 w-4" /> Delete selected
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((p) => (
          <div
            key={p.id}
            className={`relative group border rounded-md overflow-hidden ${
              selected[p.id] ? 'ring-2 ring-primary' : ''
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.urlMls || p.url}
              alt={p.filename}
              className="w-full h-32 object-cover"
              onClick={() => setSelected((s) => ({ ...s, [p.id]: !s[p.id] }))}
            />
            <input
              type="checkbox"
              className="absolute top-2 left-2 h-4 w-4 bg-white/80"
              checked={!!selected[p.id]}
              onChange={(e) =>
                setSelected((s) => ({ ...s, [p.id]: e.target.checked }))
              }
            />
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition">
              <Button
                size="icon"
                variant="outline"
                onClick={() => remove(p.id)}
                disabled={deleting === p.id}
              >
                {deleting === p.id ? (
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
