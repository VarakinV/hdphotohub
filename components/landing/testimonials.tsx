'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Check } from 'lucide-react';

type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'As a Realtor, I love having all my property photos and videos in one place. Easy to download and MLS-ready.',
    author: 'Sarah M.',
    role: 'Calgary Realtor',
  },
  {
    quote:
      'This platform saves me hours every week compared to sending photos by Dropbox or email.',
    author: 'Jason L.',
    role: 'Real Estate Photographer',
  },
  {
    quote:
      'Delivery pages look professional and my clients always compliment the experience.',
    author: 'Amelia R.',
    role: 'Toronto Realtor',
  },
  {
    quote:
      'The MLS-ready images and branded/unbranded video options are game changers for listings.',
    author: 'Carlos G.',
    role: 'Broker, Vancouver',
  },
  {
    quote:
      'Uploading everything in one place and sending a single link made my workflow 2x faster.',
    author: 'Nina P.',
    role: 'Real Estate Photographer',
  },
  {
    quote:
      "Our team can access media anytime, anywhere. It's now part of our standard listing process.",
    author: 'Mark D.',
    role: 'Marketing Manager',
  },
];

export function Testimonials() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);

  // Number of cards visible per viewport estimate (for dots/scroll step)
  const [perView, setPerView] = useState(1);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setPerView(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      setIndex(i);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Clamp page index if perView changes
  useEffect(() => {
    setIndex((i) =>
      Math.min(i, Math.max(0, Math.ceil(TESTIMONIALS.length / perView) - 1))
    );
  }, [perView]);

  const slide = (dir: -1 | 1) => {
    const el = containerRef.current;
    if (!el) return;
    const next = Math.max(
      0,
      Math.min(index + dir, Math.ceil(TESTIMONIALS.length / perView) - 1)
    );
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    setIndex(next);
  };

  const pageCount = Math.max(1, Math.ceil(TESTIMONIALS.length / perView));

  return (
    <section id="testimonials" className="bg-gray-50 border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center">
          Loved by Realtors and Photographers
        </h2>
        <p className="mt-2 text-center text-gray-600">
          Real feedback from the people who use Media Portal every day.
        </p>

        <div className="relative mt-8">
          {/* Carousel viewport */}
          <div
            ref={containerRef}
            className="overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none]"
          >
            {/* Hide scrollbar on WebKit */}
            <div className="[&::-webkit-scrollbar]:hidden">
              <div className="flex gap-4 w-full">
                {TESTIMONIALS.map((t, i) => (
                  <figure
                    key={i}
                    className="snap-start shrink-0 basis-full sm:basis-1/2 lg:basis-1/3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                  >
                    <div
                      className="flex items-center gap-1 text-amber-400"
                      aria-label="5 out of 5 stars"
                    >
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <blockquote className="mt-3 text-gray-800 leading-relaxed">
                      “{t.quote}”
                    </blockquote>
                    <figcaption className="mt-4 flex items-center gap-3">
                      <span className="inline-grid place-items-center h-8 w-8 rounded-full bg-rose-50 border border-rose-200 text-[#cb4153]">
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="leading-tight">
                        <span className="block font-semibold text-gray-900">
                          {t.author}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {t.role}
                        </span>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Previous"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-gray-700 hover:bg-gray-100"
              onClick={() => slide(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: pageCount }).map((_, i) => (
                <span
                  key={i}
                  aria-hidden
                  className={
                    'inline-block h-2 w-2 rounded-full ' +
                    (i === index ? 'bg-[#ca4153]' : 'bg-gray-300')
                  }
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Next"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-gray-700 hover:bg-gray-100"
              onClick={() => slide(1)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
