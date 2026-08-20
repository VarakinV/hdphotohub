'use client';
import { DownloadLinkButton } from '@/components/delivery/DownloadLinkButton';
import { VideoWithPoster } from '@/components/delivery/VideoWithPoster';

interface ReelPreviewCardProps {
  reel: any;
  fallbackImage?: string | null;
}

export function ReelPreviewCard({ reel, fallbackImage }: ReelPreviewCardProps) {
  const labelMap: Record<string, string> = {
    'v1-9x16': 'Vertical Reel 1 - Coming Soon',
    'v3-9x16': 'Vertical Reel 3 - For Sale',
    'v4-9x16': 'Vertical Reel 4 - Just Listed',
    'v10-9x16': 'Vertical Reel 10 - Just Listed',
    'v11-9x16': 'Vertical Reel 11 - For Sale',
    'v12-9x16': 'Vertical Reel 12 - For Sale',
    'v13-9x16': 'Vertical Reel 13 - For Sale',
    'v14-9x16': 'Vertical Reel 14 - For Sale',
    'v15-9x16': 'Vertical Reel 15 - New Listing',
    'v16-9x16': 'Vertical Reel 16 - For Sale',
    'v17-9x16': 'Vertical Reel 17 - New Listing',
  };
  return (
    <div className="border rounded-md overflow-hidden">
      {reel.url ? (
        <VideoWithPoster
          src={reel.url}
          poster={reel.thumbnail}
          fallbackImage={fallbackImage}
          aspectRatio="9/16"
        />
      ) : (
        <div className="aspect-[9/16] bg-black/5 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}
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
