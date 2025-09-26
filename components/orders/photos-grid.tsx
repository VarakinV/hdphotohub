'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, GripVertical, Star } from 'lucide-react';
import { toast } from 'sonner';

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
  const [dragId, setDragId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
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

  function reorderByIds(list: Photo[], fromId: string, toId: string) {
    const srcIdx = list.findIndex((x) => x.id === fromId);
    const dstIdx = list.findIndex((x) => x.id === toId);
    if (srcIdx === -1 || dstIdx === -1) return list;
    const copy = [...list];
    const [moved] = copy.splice(srcIdx, 1);
    copy.splice(dstIdx, 0, moved);
    return copy;
  }

  const handleDragStart = (id: string) => setDragId(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (overId: string) => {
    if (!dragId || dragId === overId) return;
    const next = reorderByIds(photos, dragId, overId);
    setPhotos(next);
    setDragId(null);
    // Auto-save order
    try {
      setSavingOrder(true);
      const ids = next.map((p) => p.id);
      const res = await fetch(`/api/orders/${orderId}/media/photos/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error('Failed to save order');
      toast.success('Photo order saved');
    } catch (e) {
      toast.error('Failed to save photo order');
    } finally {
      setSavingOrder(false);
    }
  };

  async function makeHero(photoId: string) {
    try {
      setSavingOrder(true);
      const ids = [
        photoId,
        ...photos.filter((p) => p.id !== photoId).map((p) => p.id),
      ];
      const res = await fetch(`/api/orders/${orderId}/media/photos/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error('Failed to save order');
      const byId = new Map(photos.map((p) => [p.id, p]));
      const next = ids.map((id) => byId.get(id)!).filter(Boolean) as Photo[];
      setPhotos(next);
      toast.success('Set as hero');
    } catch (e) {
      toast.error('Failed to set hero photo');
    } finally {
      setSavingOrder(false);
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
            draggable
            onDragStart={() => handleDragStart(p.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(p.id)}
          >
            {/* drag handle */}
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <span className="inline-flex items-center justify-center rounded bg-white/80 border px-1.5 py-1 text-[10px] text-gray-700 select-none">
                <GripVertical className="h-3 w-3 mr-1" /> Drag
              </span>
            </div>
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
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition flex gap-1">
              <Button
                size="icon"
                variant="outline"
                title="Make hero"
                onClick={() => makeHero(p.id)}
                disabled={savingOrder}
              >
                <Star className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => remove(p.id)}
                disabled={deleting === p.id}
                title="Delete photo"
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

      {savingOrder && (
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Saving order...
        </div>
      )}
    </div>
  );
}
