'use client';

import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function DownloadLinkButton({
  url,
  label = 'Download',
  fileName,
  className,
  fullWidth = true,
}: {
  url: string;
  label?: string;
  fileName?: string;
  className?: string;
  fullWidth?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    try {
      setLoading(true);
      // Route through our API when URL is external
      const isExternal =
        /^https?:\/\//i.test(url) && !url.startsWith(window.location.origin);
      const apiUrl = isExternal
        ? `/api/delivery/proxy?url=${encodeURIComponent(
            url
          )}&filename=${encodeURIComponent(fileName || label)}`
        : url;

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to download file');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName || label.replace(/\s+/g, '-').toLowerCase();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={loading}
      className={`${
        fullWidth ? 'w-full' : ''
      } justify-center whitespace-nowrap ${className || ''}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className="ml-1">{label}</span>
    </Button>
  );
}
