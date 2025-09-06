'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Optional: pass a list of items to enable nav across multiple images
type Item = { src: string; alt: string };

export function PhotoLightbox({
  src,
  alt,
  items,
  startIndex,
  thumbClassName = 'w-full h-32 object-cover cursor-pointer',
}: {
  src: string;
  alt: string;
  items?: Item[];
  startIndex?: number;
  thumbClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(startIndex ?? 0);

  const list: Item[] = useMemo(
    () => (items && items.length ? items : [{ src, alt }]),
    [items, src, alt]
  );
  const current = list[index] ?? { src, alt };
  const hasNav = list.length > 1;

  useEffect(() => {
    if (!open || !hasNav) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % list.length);
      if (e.key === 'ArrowLeft')
        setIndex((i) => (i - 1 + list.length) % list.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, hasNav, list.length]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={thumbClassName}
        loading="lazy"
        onClick={() => {
          setIndex(startIndex ?? 0);
          setOpen(true);
        }}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 bg-transparent border-0 shadow-none w-full max-w-[calc(100vw-2rem)] sm:max-w-[1200px]">
          <DialogTitle className="sr-only">
            {current.alt || 'Photo preview'}
          </DialogTitle>
          <div className="relative w-full max-h-[calc(100vh-2rem)] flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.src}
              alt={current.alt}
              className="block max-w-full max-h-[calc(100vh-2rem)] w-auto h-auto"
            />
            {hasNav && (
              <>
                <button
                  aria-label="Previous"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/70 text-white rounded-full p-2"
                  onClick={() =>
                    setIndex((i) => (i - 1 + list.length) % list.length)
                  }
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  aria-label="Next"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/70 text-white rounded-full p-2"
                  onClick={() => setIndex((i) => (i + 1) % list.length)}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
