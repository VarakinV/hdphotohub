'use client';
import { DownloadLinkButton } from '@/components/delivery/DownloadLinkButton';

export function ReelPreviewCard({ reel }: { reel: any }) {
  const labelMap: Record<string, string> = {
    'v1-9x16': 'Vertical Reel 1 - Just Listed',
    'v3-9x16': 'Vertical Reel 3 - For Sale',
    'v4-9x16': 'Vertical Reel 4 - Just Listed',
  };
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="aspect-[9/16] bg-black/5">
        <video
          controls
          className="w-full h-full object-cover"
          poster={reel.thumbnail || undefined}
        >
          {reel.url ? <source src={reel.url} type="video/mp4" /> : null}
        </video>
      </div>
      <div className="px-2 pt-2 text-xs text-gray-600 flex items-center justify-between">
        <span className="truncate">
          {labelMap[(reel.variantKey || '').toLowerCase()] ||
            (reel.variantKey || '').toUpperCase()}
        </span>
        {reel.width && reel.height ? (
          <span className="ml-2 whitespace-nowrap">
            {reel.width}×{reel.height}
          </span>
        ) : null}
      </div>
      <div className="p-2 text-center">
        {reel.url ? (
          <DownloadLinkButton
            url={reel.url}
            label="Download"
            fileName={`reel-${reel.variantKey}.mp4`}
          />
        ) : (
          <div className="text-gray-500 text-sm">Processing...</div>
        )}
      </div>
    </div>
  );
}
