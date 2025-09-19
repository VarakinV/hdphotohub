'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { CopyButton } from '@/components/common/CopyButton';

interface HeroSliderProps {
  images: string[];
  url: string;
  title?: string;
  className?: string;
}

export default function HeroSlider({
  images,
  url,
  title,
  className,
}: HeroSliderProps) {
  const slides = useMemo(() => images.filter(Boolean).slice(0, 5), [images]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 7000); // 7s per slide
    return () => clearInterval(id);
  }, [slides.length]);

  const shareUrl = useMemo(() => {
    try {
      if (url.startsWith('http')) return url;
      return typeof window !== 'undefined'
        ? new URL(url, window.location.origin).toString()
        : url;
    } catch {
      return url;
    }
  }, [url]);

  const shareText = title || 'Check out this property';
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    shareUrl
  )}&quote=${encodeURIComponent(shareText)}`;
  const twHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
    shareUrl
  )}&text=${encodeURIComponent(shareText)}`;

  return (
    <div
      className={`relative isolate w-full min-h-[55vh] md:min-h-[80vh] overflow-hidden ${
        className || ''
      }`}
    >
      {/* Slides */}
      <div className="absolute inset-0">
        {slides.length > 0 ? (
          slides.map((src, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                i === index ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div
                className={`absolute inset-0 transform transition-transform duration-[7000ms] ease-out ${
                  i === index ? 'scale-105' : 'scale-100'
                }`}
              >
                <Image
                  src={src}
                  alt={title || 'Property image'}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            </div>
          ))
        ) : (
          <div className="absolute inset-0 bg-gray-200" />
        )}
      </div>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Share icons bottom-left */}
      <div className="absolute left-4 bottom-4 z-50 flex items-center gap-2 pointer-events-auto">
        <a
          href={fbHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1877F2] hover:bg-white transition"
          aria-label="Share on Facebook"
        >
          <Facebook className="w-5 h-5" />
        </a>
        <a
          href={twHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black hover:bg-white transition"
          aria-label="Share on X"
        >
          <Twitter className="w-5 h-5" />
        </a>
        {/* Instagram does not have a web share intent; use copy link with icon */}
        <CopyButton
          text={shareUrl}
          label=""
          size="icon"
          icon={<Instagram className="w-5 h-5 text-[#E4405F]" />}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 hover:bg-white"
        />
      </div>
    </div>
  );
}
