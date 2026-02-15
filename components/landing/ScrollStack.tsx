'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface ScrollStackItem {
  title: string;
  description: string;
  image: string;
}

interface ScrollStackProps {
  items: ScrollStackItem[];
}

export function ScrollStack({ items }: ScrollStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll('.stack-card');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setActiveIndex(index);
          }
        });
      },
      {
        root: null,
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0,
      }
    );

    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {items.map((item, index) => (
        <div
          key={index}
          data-index={index}
          className="stack-card sticky top-24 mb-8 last:mb-0"
          style={{
            zIndex: index + 1,
            transform: `translateY(${index * 20}px)`,
          }}
        >
          <div 
            className={`bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-500 ${
              activeIndex >= index ? 'opacity-100 scale-100' : 'opacity-90 scale-[0.98]'
            }`}
            style={{
              transform: activeIndex > index ? `scale(${1 - (activeIndex - index) * 0.03})` : 'scale(1)',
            }}
          >
            <div className="grid md:grid-cols-2 gap-0">
              {/* Image Side */}
              <div className="relative aspect-[4/3] md:aspect-auto bg-white">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              
              {/* Content Side */}
              <div className="flex flex-col justify-center p-8 md:p-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#ca4153]/10 text-[#ca4153] font-bold text-xl mb-4">
                  {index + 1}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
      {/* Spacer for scroll release */}
      <div className="h-[30vh]" />
    </div>
  );
}

