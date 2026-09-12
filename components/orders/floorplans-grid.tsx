'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { DeleteIconButton } from '@/components/admin/ui/icon-action';

interface Item {
  id: string;
  url: string;
  filename: string;
}

export function FloorplansGrid({
  orderId,
  refreshToken = 0,
}: {
  orderId: string;
  refreshToken?: number;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/media/floorplans`);
      if (res.ok) setItems(await res.json());
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
      await fetch(`/api/orders/${orderId}/media/floorplans`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      setItems((p) => p.filter((x) => !ids.includes(x.id)));
      setSelected({});
    } finally {
      setDeleting(null);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/orders/${orderId}/media/floorplans`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      setItems((p) => p.filter((x) => x.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  if (loading)
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading floor plans...
      </div>
    );

  if (!items.length)
    return <div className="text-sm text-muted-foreground">No floor plans yet</div>;

  const allSelected = items.length > 0 && selectedIds.length === items.length;

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
                setSelected(Object.fromEntries(items.map((v) => [v.id, true])));
              else setSelected({});
            }}
          />
          <span className="text-sm text-muted-foreground">
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((p) => (
          <div
            key={p.id}
            className={`relative group border rounded-md overflow-hidden ${
              selected[p.id] ? 'ring-2 ring-primary' : ''
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={p.filename}
              className="aspect-[4/3] w-full object-contain bg-surface-2"
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
              <DeleteIconButton
                label="Delete floor plan"
                onClick={() => remove(p.id)}
                loading={deleting === p.id}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
