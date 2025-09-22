'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

export function PhotosZipDownloader({
  orderId,
  size = 'default',
}: {
  orderId: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
}) {
  const [loading, setLoading] = useState<null | 'original' | 'mls'>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function download(variant: 'original' | 'mls') {
    try {
      setLoading(variant);
      setProgress(0);
      const url = `/api/delivery/${orderId}/photos.zip?variant=${variant}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to prepare ZIP');

      const total = Number(res.headers.get('content-length') || 0);
      if (res.body && total > 0) {
        // Stream with progress
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let loaded = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loaded += value.length;
            setProgress(Math.round((loaded / total) * 100));
          }
        }
        // Cast chunks to BlobPart[] to satisfy TS; runtime supports Uint8Array parts
        const blob = new Blob(chunks as unknown as BlobPart[], {
          type: 'application/zip',
        });
        triggerDownload(blob, `photos-${variant}.zip`);
      } else {
        // Fallback: no content-length; show indeterminate and finalize when done
        setProgress(null);
        const blob = await res.blob();
        triggerDownload(blob, `photos-${variant}.zip`);
      }
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(null);
      setProgress(null);
    }
  }

  function triggerDownload(blob: Blob, filename: string) {
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  }

  const busy = loading !== null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => download('original')}
          disabled={busy}
          size={size}
          className="border-2 border-white/90"
        >
          {loading === 'original' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Preparing
              Originals...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" /> Download Originals (ZIP)
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => download('mls')}
          disabled={busy}
          size={size}
        >
          {loading === 'mls' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Preparing MLS...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" /> Download MLS 1280px (ZIP)
            </>
          )}
        </Button>
      </div>
      {busy && (
        <div className="h-2 w-full bg-gray-200 rounded overflow-hidden">
          {progress != null ? (
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          ) : (
            <div className="h-full bg-blue-500 animate-pulse w-1/3" />
          )}
        </div>
      )}
    </div>
  );
}
