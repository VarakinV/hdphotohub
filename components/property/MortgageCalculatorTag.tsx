'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calculator } from 'lucide-react';

export default function MortgageCalculatorTag({
  orderId,
  template,
}: {
  orderId: string;
  template: string;
}) {
  const [showTrigger, setShowTrigger] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTrigger(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!showTrigger) return null;

  return (
    <Link
      href={`/property/${orderId}/${template}/mortgage`}
      className="group fixed right-0 top-[calc(50%-4rem)] z-[900] flex h-12 w-12 items-center justify-start overflow-hidden rounded-none bg-[#c02a32] px-3 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:w-48 hover:bg-[#a8232a]"
      aria-label="Open mortgage calculator"
    >
      <Calculator className="h-6 w-6 shrink-0" />
      <span className="ml-3 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        Can I afford this?
      </span>
    </Link>
  );
}