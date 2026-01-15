'use client';

import { useRef, useState, useEffect } from 'react';

interface VideoWithPosterProps {
  src: string;
  poster?: string | null;
  fallbackImage?: string | null;
  className?: string;
  aspectRatio?: 'video' | '9/16' | '16/9';
}

/**
 * Video player that generates a thumbnail from the video itself.
 * Falls back to provided poster, then fallbackImage if video frame capture fails.
 * Ensures users always see something instead of a black screen.
 */
export function VideoWithPoster({
  src,
  poster,
  fallbackImage,
  className = '',
  aspectRatio = 'video',
}: VideoWithPosterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [generatedPoster, setGeneratedPoster] = useState<string | null>(null);
  const [posterError, setPosterError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Determine the best poster to use
  const effectivePoster = generatedPoster || poster || (posterError ? fallbackImage : null) || fallbackImage;

  useEffect(() => {
    // If we already have a server-provided poster, use it
    if (poster) {
      setIsLoading(false);
      return;
    }

    // Try to generate a poster from the video
    const video = videoRef.current;
    if (!video || !src) return;

    let mounted = true;
    let objectUrl: string | null = null;

    const generatePoster = () => {
      if (!mounted) return;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Check if the frame is mostly black (failed capture)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let totalBrightness = 0;
        const sampleSize = Math.min(1000, pixels.length / 4);
        const step = Math.floor(pixels.length / 4 / sampleSize);
        
        for (let i = 0; i < pixels.length; i += step * 4) {
          totalBrightness += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        }
        
        const avgBrightness = totalBrightness / sampleSize;
        
        // If average brightness is too low, the frame is likely black
        if (avgBrightness < 10) {
          throw new Error('Captured frame appears to be black');
        }

        canvas.toBlob(
          (blob) => {
            if (!mounted || !blob) {
              setPosterError(true);
              setIsLoading(false);
              return;
            }
            objectUrl = URL.createObjectURL(blob);
            setGeneratedPoster(objectUrl);
            setIsLoading(false);
          },
          'image/jpeg',
          0.8
        );
      } catch (e) {
        console.warn('[VideoWithPoster] Failed to generate poster:', e);
        setPosterError(true);
        setIsLoading(false);
      }
    };

    const handleLoadedData = () => {
      // Seek to 1 second to avoid black intro frames
      if (video.duration > 1) {
        video.currentTime = 1;
      } else if (video.duration > 0) {
        video.currentTime = video.duration * 0.1;
      }
    };

    const handleSeeked = () => {
      // Wait a tiny bit for the frame to render
      setTimeout(generatePoster, 50);
    };

    const handleError = () => {
      if (mounted) {
        setPosterError(true);
        setIsLoading(false);
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    // Timeout fallback - if nothing happens in 5 seconds, use fallback
    const timeout = setTimeout(() => {
      if (mounted && !generatedPoster && isLoading) {
        setPosterError(true);
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src, poster, generatedPoster, isLoading]);

  const aspectClass =
    aspectRatio === '9/16'
      ? 'aspect-[9/16]'
      : aspectRatio === '16/9'
      ? 'aspect-video'
      : 'aspect-video';

  return (
    <div className={`${aspectClass} bg-black/5 relative ${className}`}>
      {/* Show fallback image while loading if no poster */}
      {isLoading && !effectivePoster && fallbackImage && (
        <img
          src={fallbackImage}
          alt="Loading..."
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <video
        ref={videoRef}
        controls
        className="w-full h-full object-cover"
        poster={effectivePoster || undefined}
        preload="metadata"
        crossOrigin="anonymous"
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}

