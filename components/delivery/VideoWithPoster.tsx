'use client';

import { useState } from 'react';

interface VideoWithPosterProps {
  src: string;
  poster?: string | null;
  fallbackImage?: string | null;
  className?: string;
  aspectRatio?: 'video' | '9/16' | '16/9';
}

/**
 * Video player with a server-generated poster. Falls back to a provided
 * fallbackImage while loading. No crossOrigin attribute: S3 buckets without
 * CORS config would block CORS-mode video requests, making the play button
 * unusable.
 */
export function VideoWithPoster({
  src,
  poster,
  fallbackImage,
  className = '',
  aspectRatio = 'video',
}: VideoWithPosterProps) {
  const [posterError, setPosterError] = useState(false);

  const effectivePoster =
    !posterError && poster ? poster : fallbackImage || undefined;

  const aspectClass =
    aspectRatio === '9/16'
      ? 'aspect-[9/16]'
      : aspectRatio === '16/9'
      ? 'aspect-video'
      : 'aspect-video';

  return (
    <div className={`${aspectClass} bg-black/5 relative ${className}`}>
      {effectivePoster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={effectivePoster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          onError={() => setPosterError(true)}
        />
      )}
      <video
        controls
        className="relative z-[1] w-full h-full object-cover"
        preload="metadata"
        // Native poster stays visible until playback starts, even after the
        // first frame is decoded — the background <img> alone would be
        // covered by the video's opening frame once metadata loads.
        poster={effectivePoster || undefined}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
