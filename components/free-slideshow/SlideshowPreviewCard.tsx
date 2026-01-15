'use client';

import { DownloadLinkButton } from '@/components/delivery/DownloadLinkButton';
import { VideoWithPoster } from '@/components/delivery/VideoWithPoster';

interface SlideshowPreviewCardProps {
  slideshow: any;
  fallbackImage?: string | null;
}

export function SlideshowPreviewCard({ slideshow, fallbackImage }: SlideshowPreviewCardProps) {
  const labelMap: Record<string, string> = {
    'h1-16x9': 'Slideshow 1920x1080',
  };

  const key = (slideshow.variantKey || '').toLowerCase();

  return (
    <div className="border rounded-md overflow-hidden">
      {slideshow.url ? (
        <VideoWithPoster
          src={slideshow.url}
          poster={slideshow.thumbnail}
          fallbackImage={fallbackImage}
          aspectRatio="16/9"
        />
      ) : (
        <div className="aspect-[16/9] bg-black/5 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}
      <div className="px-2 pt-2 text-xs text-gray-600 flex items-center justify-between">
        <span className="truncate">
          {labelMap[key] || (slideshow.variantKey || '').toUpperCase()}
        </span>
        {slideshow.width && slideshow.height ? (
          <span className="ml-2 whitespace-nowrap">
            {slideshow.width}×{slideshow.height}
          </span>
        ) : null}
      </div>
      <div className="p-2 text-center">
        {slideshow.url ? (
          <DownloadLinkButton
            url={slideshow.url}
            label="Download"
            fileName={`slideshow-${slideshow.variantKey}.mp4`}
          />
        ) : (
          <div className="text-gray-500 text-sm">Processing...</div>
        )}
      </div>
    </div>
  );
}
