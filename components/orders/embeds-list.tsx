'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';

interface Item { id: string; title: string; embedUrl: string }

export function EmbedsList({ orderId, refreshToken = 0 }: { orderId: string; refreshToken?: number }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/media/embeds`);
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [orderId, refreshToken]);

  async function remove(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/orders/${orderId}/media/embeds`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      });
      setItems((p)=> p.filter(x=> x.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <div className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Loading embeds...</div>;

  if (!items.length) return <div className="text-sm text-gray-500">No embeds yet</div>;

  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map(p => (
        <div key={p.id} className="border rounded-md p-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">{p.title}</div>
            <Button size="icon" variant="outline" onClick={()=> remove(p.id)} disabled={deleting===p.id}>
              {deleting===p.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
            </Button>
          </div>
          <div className="mt-2">
            <iframe src={p.embedUrl} className="w-full h-64 border rounded" allowFullScreen/>
          </div>
        </div>
      ))}
    </div>
  );
}

