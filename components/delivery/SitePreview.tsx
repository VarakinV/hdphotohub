'use client';

import { useRef, useState, useEffect } from 'react';

interface SitePreviewProps {
  src: string;
  title: string;
  iframeWidth?: number;
  iframeHeight?: number;
}

export function SitePreview({ src, title, iframeWidth = 1280, iframeHeight = 720 }: SitePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    function updateScale() {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setScale(containerWidth / iframeWidth);
      }
    }
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [iframeWidth]);

  const scaledHeight = iframeHeight * scale;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden pointer-events-none bg-black/5"
      style={{ height: `${scaledHeight}px` }}
    >
      <iframe
        src={src}
        title={title}
        className="absolute top-0 left-0 border-0"
        style={{
          width: `${iframeWidth}px`,
          height: `${iframeHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        loading="lazy"
        tabIndex={-1}
      />
    </div>
  );
}
