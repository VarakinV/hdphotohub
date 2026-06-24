'use client';

import { useRef } from 'react';
import { PhotoLightbox } from '@/components/delivery/PhotoLightbox';

type Item = { src: string; alt: string };

export default function V6FloorPlanCard({
  src,
  alt,
  items,
  startIndex,
  label,
}: {
  src: string;
  alt: string;
  items: Item[];
  startIndex: number;
  label: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const triggerLightbox = () => {
    const img = cardRef.current?.querySelector('img');
    if (img instanceof HTMLImageElement) img.click();
  };

  return (
    <div className="v6-fp-card" ref={cardRef}>
      {/* Image fills fixed height */}
      <div className="v6-fp-img">
        <PhotoLightbox
          src={src}
          alt={alt}
          items={items}
          startIndex={startIndex}
          thumbClassName="v6-fp-thumb"
        />
      </div>
      <div className="v6-fp-info">
        <h3 className="v6-fp-title">{label}</h3>
        <button
          type="button"
          className="v6-fp-btn"
          onClick={triggerLightbox}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
          View Full Size
        </button>
      </div>
    </div>
  );
}
