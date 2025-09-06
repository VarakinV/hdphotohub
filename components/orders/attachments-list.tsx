'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Download } from 'lucide-react';

interface Item {
  id: string;
  url: string;
  filename: string;
}

export function AttachmentsList({
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
      const res = await fetch(`/api/orders/${orderId}/media/attachments`);
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
      await fetch(`/api/orders/${orderId}/media/attachments`, {
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
      await fetch(`/api/orders/${orderId}/media/attachments`, {
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
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading attachments...
      </div>
    );

  if (!items.length)
    return <div className="text-sm text-gray-500">No attachments yet</div>;

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

      <div className="space-y-2">
        {items.map((p) => (
          <div
            key={p.id}
            className={`flex items-center justify-between border rounded-md p-2 ${
              selected[p.id] ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={!!selected[p.id]}
                onChange={(e) =>
                  setSelected((s) => ({ ...s, [p.id]: e.target.checked }))
                }
              />
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline flex-1"
              >
                {p.filename}
              </a>
            </div>
            <div className="flex gap-2">
              <Button asChild size="icon" variant="outline">
                <a href={p.url} target="_blank" rel="noreferrer" download>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
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
