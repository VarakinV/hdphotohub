'use client';

import { Aurora } from './Aurora';

export function FreeToolsHero() {
  const scrollToTools = () => {
    const toolsSection = document.getElementById('tools');
    if (toolsSection) {
      toolsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#131c3b]">
      {/* Aurora Background */}
      <Aurora
        colorStops={['#ca4153', '#d65a6a', '#ca4153']}
        amplitude={1.2}
        blend={0.6}
        speed={0.8}
      />

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#131c3b]/60 via-transparent to-[#131c3b]/80 z-10" />

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center pt-16">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white">
          Free Real Estate Marketing Tools for Calgary Realtors
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
          Generate listing reels, property flyers, slideshows, and QR codes using
          your photos.
          <br />
          <span className="text-white/70">
            No design skills. No credit card. Free to use.
          </span>
        </p>
        <button
          onClick={scrollToTools}
          className="mt-10 inline-flex items-center justify-center rounded-md bg-white text-[#ca4153] font-semibold px-8 py-4 text-lg shadow-lg hover:opacity-90 transition-all duration-200 hover:scale-105 cursor-pointer"
        >
          Create Listing Content
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <svg
          className="w-6 h-6 text-white/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
}

