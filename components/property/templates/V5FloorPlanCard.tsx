'use client';

import { useRef } from 'react';
import { PhotoLightbox } from '@/components/delivery/PhotoLightbox';

type Item = { src: string; alt: string };

export default function V5FloorPlanCard({
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
    <div className="v5-fp-card" ref={cardRef}>
      <div className="v5-fp-img">
        <PhotoLightbox
          src={src}
          alt={alt}
          items={items}
          startIndex={startIndex}
          thumbClassName="w-full h-full object-contain cursor-pointer"
        />
      </div>
      <div className="v5-fp-footer">
        <span className="v5-fp-name">{label}</span>
        <button
          type="button"
          className="v5-fp-action"
          onClick={triggerLightbox}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            letterSpacing: 'inherit',
            textTransform: 'inherit',
            color: 'inherit',
          }}
        >
          View Full Size →
        </button>
      </div>
    </div>
  );
}
