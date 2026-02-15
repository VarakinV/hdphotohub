'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ExitIntentPopupProps {
  bookingUrl: string;
  promoCode: string;
}

export function ExitIntentPopup({ bookingUrl, promoCode }: ExitIntentPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    // Check if already shown in this session
    const alreadyShown = sessionStorage.getItem('exitIntentShown');
    if (alreadyShown) {
      setHasTriggered(true);
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves from the top of the page
      if (e.clientY <= 0 && !hasTriggered) {
        setIsVisible(true);
        setHasTriggered(true);
        sessionStorage.setItem('exitIntentShown', 'true');
      }
    };

    // Add delay before enabling exit intent (don't trigger immediately)
    const timeout = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 3000);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasTriggered]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsVisible(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={() => setIsVisible(false)}
    >
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header gradient */}
        <div className="bg-gradient-to-r from-[#ca4153] to-[#a83343] px-8 py-6 text-center">
          <p className="text-white/90 text-sm font-medium uppercase tracking-wide mb-2">
            Wait! Before You Go...
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            Get 25% Off Your First Order
          </h3>
        </div>

        {/* Content */}
        <div className="px-8 py-6 text-center">
          <p className="text-gray-600 mb-6">
            Don&apos;t miss out on a complete marketing kit for your next listing — 
            including reels, slideshows, flyers, and property websites.
          </p>

          {/* Promo code box */}
          <div className="bg-gray-100 rounded-lg px-6 py-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Use promo code:</p>
            <p className="text-2xl font-bold text-[#ca4153] tracking-wider">{promoCode}</p>
          </div>

          {/* CTA Button */}
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full rounded-full bg-[#ca4153] px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-[#a83343] transition-colors"
          >
            Claim Your Discount
          </a>

          <button
            onClick={() => setIsVisible(false)}
            className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            No thanks, I&apos;ll pay full price
          </button>
        </div>
      </div>
    </div>
  );
}

