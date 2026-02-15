'use client';

import { useEffect, useRef, useState } from 'react';

interface LoyaltyCounterProps {
  targetValue?: number;
  duration?: number;
}

export function LoyaltyCounter({ targetValue = 3500, duration = 2000 }: LoyaltyCounterProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const counterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = counterRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateCounter();
          }
        });
      },
      {
        threshold: 0.5,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasAnimated]);

  const animateCounter = () => {
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div ref={counterRef} className="text-center">
      <div className="inline-flex items-baseline gap-2">
        <span className="text-6xl sm:text-7xl lg:text-8xl font-bold text-[#ca4153] tabular-nums">
          {count.toLocaleString()}
        </span>
        <span className="text-2xl sm:text-3xl font-semibold text-gray-600">pts</span>
      </div>
      <p className="mt-4 text-gray-500 text-lg">
        Points earned by Calgary Realtors
      </p>
    </div>
  );
}

