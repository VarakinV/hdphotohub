'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';

export default function TopAnchorMenu({
  showFeatures,
  showDescription,
  showPhotos,
  showFloorPlans,
  showVideo,
  showTours,
  showMap,
}: {
  showFeatures: boolean;
  showDescription: boolean;
  showPhotos: boolean;
  showFloorPlans: boolean;
  showVideo: boolean;
  showTours: boolean;
  showMap: boolean;
}) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: '#details', label: 'Details', show: true },
    { href: '#features', label: 'Features', show: showFeatures },
    { href: '#description', label: 'Description', show: showDescription },
    { href: '#photos', label: 'Photos', show: showPhotos },
    { href: '#floorplans', label: 'Floor Plans', show: showFloorPlans },
    { href: '#video', label: 'Video', show: showVideo },
    { href: '#tours', label: 'Virtual Tour', show: showTours },
    { href: '#contact', label: 'Contact', show: true },
    { href: '#map', label: 'Map', show: showMap },
  ].filter((l) => l.show);

  return (
    <div className="absolute inset-x-0 top-0 z-50 pointer-events-auto">
      {/* Desktop/tablet: centered links */}
      <nav className="hidden md:flex justify-center px-4 py-3 text-white/95 text-lg gap-2">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="px-3 py-1 uppercase tracking-wide hover:underline underline-offset-4"
          >
            {l.label}
          </a>
        ))}
      </nav>

      {/* Mobile: hamburger */}
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen((o) => !o)}
        className="md:hidden absolute right-3 top-3 inline-flex items-center justify-center rounded-md bg-black/30 backdrop-blur p-2 text-white"
      >
        <Menu className="w-6 h-6" />
      </button>
      {open && (
        <div className="md:hidden absolute right-3 top-12">
          <div className="mt-1 rounded-md bg-black/60 text-white backdrop-blur px-3 py-2 text-sm shadow-lg">
            <div className="flex flex-col items-stretch min-w-[200px]">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="px-3 py-2 uppercase tracking-wide hover:bg-white/10 rounded hover:underline underline-offset-4"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
