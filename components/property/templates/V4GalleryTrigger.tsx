'use client';

import { useRef } from 'react';
import { PhotoLightbox } from '@/components/delivery/PhotoLightbox';

type Item = { src: string; alt: string };

export default function V4GalleryTrigger({
  items,
  count,
}: {
  items: Item[];
  count: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    const img = wrapRef.current?.querySelector('img');
    if (img instanceof HTMLImageElement) img.click();
  };

  /*
   * PhotoLightbox renders a trigger <img> and a Dialog portal.
   * We hide the trigger <img> entirely and use a styled <button> as the
   * visible element. Clicking the button calls img.click() on the hidden
   * trigger, which in turn opens the Dialog.
   */
  return (
    <div className="v4-view-all-wrap" ref={wrapRef}>
      {/* Hidden PhotoLightbox — its Dialog portal still works */}
      <div
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <PhotoLightbox
          src={items[0]?.src || ''}
          alt={items[0]?.alt || ''}
          items={items}
          startIndex={0}
          thumbClassName="v4-gallery-hidden-trigger"
        />
      </div>

      {/* Visible "View All Photos" button */}
      <button
        type="button"
        className="v4-view-all-btn"
        onClick={handleClick}
      >
        View All {count} Photos
      </button>
    </div>
  );
}
