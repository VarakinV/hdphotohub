'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus } from 'lucide-react';

export function EmbedsForm({
  orderId,
  onAdded,
}: {
  orderId: string;
  onAdded: () => void;
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/media/embeds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, embedUrl: url }),
      });
      if (!res.ok) throw new Error('Failed to add embed');
      setTitle('');
      setUrl('');
      onAdded();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        className="w-full"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        className="w-full"
        placeholder="Embed URL (Matterport, iGUIDE, etc.)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Button onClick={submit} disabled={loading || !title || !url}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" /> Add
          </>
        )}
      </Button>
    </div>
  );
}
