'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import JSZip from 'jszip';

export interface PhotoForZip {
  id: string;
  url: string;
  urlMls: string | null;
  filename: string;
}

export function PhotosZipDownloader({
  photos,
  size = 'default',
  appearance = 'hero',
}: {
  orderId: string;
  photos: PhotoForZip[];
  size?: 'sm' | 'default' | 'lg' | 'icon';
  appearance?: 'hero' | 'section';
}) {
  const [loading, setLoading] = useState<null | 'original' | 'mls'>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [statusText, setStatusText] = useState('');

  async function download(variant: 'original' | 'mls') {
    if (!photos.length) return;
    try {
      setLoading(variant);
      setProgress(0);
      setStatusText('');

      const zip = new JSZip();
      let completed = 0;
      const total = photos.length;

      // Download photos sequentially in small batches to avoid overwhelming the browser
      const BATCH_SIZE = 3;
      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = photos.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(async (photo) => {
            // Always proxy through our API to avoid S3 CORS issues
            const photoUrl = `/api/delivery/photo/${photo.id}?variant=${variant}`;
            const res = await fetch(photoUrl);
            if (!res.ok) throw new Error(`Failed to fetch ${photo.filename}`);
            const buf = await res.arrayBuffer();
            const name =
              variant === 'mls'
                ? photo.filename.replace(/\.[^.]+$/, '') + '-mls.jpg'
                : photo.filename;
            zip.file(name, buf);
          })
        );

        // Count completed (both fulfilled and rejected advance the counter)
        completed += results.length;
        setProgress(Math.round((completed / total) * 100));
        setStatusText(`${completed} / ${total} photos`);
      }

      setStatusText('Creating ZIP...');
      setProgress(null);
      const content = await zip.generateAsync({ type: 'blob' });
      triggerDownload(content, `photos-${variant}.zip`);
    } catch (e) {
      alert((e as Error).message || 'Failed to prepare ZIP');
    } finally {
      setLoading(null);
      setProgress(null);
      setStatusText('');
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
  const isSection = appearance === 'section';
  const btnSize = isSection ? 'sm' : 'lg';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant={isSection ? 'outline' : 'default'}
          onClick={() => download('original')}
          disabled={busy}
          size={btnSize}
          className={
            isSection
              ? undefined
              : 'bg-brick-500 hover:bg-brick-600 text-white px-7 text-[15px] h-12'
          }
        >
          {loading === 'original' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Preparing...
            </>
          ) : (
            <>
              {!isSection && <Download className="h-4 w-4" />}
              {isSection ? 'Download originals' : 'Download all photos'}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant={isSection ? 'outline' : 'default'}
          onClick={() => download('mls')}
          disabled={busy}
          size={btnSize}
          className={
            isSection
              ? undefined
              : 'bg-navy-700 hover:bg-navy-600 text-white px-7 text-[15px] h-12'
          }
        >
          {loading === 'mls' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Preparing...
            </>
          ) : (
            <>
              {!isSection && <Download className="h-4 w-4" />}
              {isSection ? 'Download MLS size' : 'Download MLS set'}
            </>
          )}
        </Button>
      </div>
      {busy && (
        <div className="space-y-1">
          <div className="h-2 w-full bg-gray-200 rounded overflow-hidden">
            {progress != null ? (
              <div
                className="h-full bg-navy-700 transition-all"
                style={{ width: `${progress}%` }}
              />
            ) : (
              <div className="h-full bg-navy-700 animate-pulse w-1/3" />
            )}
          </div>
          {statusText && (
            <p className="text-xs text-gray-500">{statusText}</p>
          )}
        </div>
      )}
    </div>
  );
}
