'use client';

import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import BookShowingPopup from '@/components/property/BookShowingPopup';

export default function HeroBookCTA({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="v6-hero-cta-wrap" style={{ pointerEvents: 'auto' }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="v6-hero-cta-primary"
      >
        <CalendarDays size={18} />
        Book a Showing
      </button>
      <BookShowingPopup open={open} onClose={() => setOpen(false)} orderId={orderId} />
    </div>
  );
}
