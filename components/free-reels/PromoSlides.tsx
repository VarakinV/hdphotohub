'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    title: 'Did you know every order includes 9 social reels?',
    body: 'Each photo package comes with 9 custom reels—professionally designed to boost your listings, attract more buyers, and stand out on social media.',
  },
  {
    title: 'Did you know you get 3 beautiful property flyers for free?',
    body: 'Every order includes 3 high-quality PDF flyers. Perfect for open houses, and online marketing. We make your listings shine everywhere.',
  },
  {
    title: 'Did you know each order comes with 3 custom property websites?',
    body: 'Get 3 stunning property websites with every order—fully branded, mobile-friendly, and ready to share across your marketing channels.',
  },
  {
    title: 'Did you know you earn rewards every time you order?',
    body: "You'll automatically earn loyalty points with every order, review, and referral. Redeem them for discounts and exclusive perks as a valued client.",
  },
];

export function PromoSlides() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 10000);
    return () => clearInterval(t);
  }, []);
  const s = slides[idx];
  return (
    <div className="relative rounded-md border border-gray-200 bg-white px-10 md:px-12 py-4 shadow-sm">
      <div className="text-lg md:text-xl font-semibold mb-1">{s.title}</div>
      <div className="text-gray-600 text-sm md:text-base">{s.body}</div>
      <div className="mt-3 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === idx ? 'bg-gray-800 w-6' : 'bg-gray-300 w-2'
            }`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
      <button
        aria-label="Previous slide"
        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-full border bg-white/90 hover:bg-white"
        onClick={() => setIdx((i) => (i - 1 + slides.length) % slides.length)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        aria-label="Next slide"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-full border bg-white/90 hover:bg-white"
        onClick={() => setIdx((i) => (i + 1) % slides.length)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
