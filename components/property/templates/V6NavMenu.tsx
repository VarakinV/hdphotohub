'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import BookShowingPopup from '@/components/property/BookShowingPopup';

/* ─────────────────────────────────────────────────────────────────
   V6 Nav: transparent overlay on hero → white/95 + shadow on scroll.
   Links: white text when transparent, dark when scrolled.
───────────────────────────────────────────────────────────────── */
const V6_NAV_CSS = `
  .v6-nav {
    position: fixed; top: 0; left: 0; width: 100%;
    z-index: 50; transition: background 0.35s ease, box-shadow 0.35s ease;
  }
  .v6-nav-transparent { background: transparent; }
  .v6-nav-scrolled {
    background: rgba(255,255,255,0.97);
    backdrop-filter: blur(14px);
    box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06);
  }

  .v6-nav-inner {
    max-width: 1280px; margin: 0 auto; padding: 0 20px;
    display: flex; justify-content: space-between; align-items: center;
    height: 80px;
  }

  /* Brand / logo */
  .v6-nav-brand {
    font-family: 'Playfair Display', serif;
    font-size: 1.15rem; font-weight: 600;
    text-decoration: none; display: flex; align-items: center;
    transition: color 0.3s;
    flex-shrink: 0;
  }
  .v6-nav-transparent .v6-nav-brand { color: white; }
  .v6-nav-scrolled   .v6-nav-brand { color: #453f39; }

  /* Desktop links */
  .v6-nav-links {
    display: flex; align-items: center; gap: 24px;
  }
  .v6-nav-link {
    font-size: 0.78rem; font-weight: 500;
    letter-spacing: 0.07em; text-transform: uppercase;
    text-decoration: none; transition: color 0.3s;
  }
  .v6-nav-transparent .v6-nav-link { color: rgba(255,255,255,0.88); }
  .v6-nav-transparent .v6-nav-link:hover { color: white; }
  .v6-nav-scrolled   .v6-nav-link { color: #374151; }
  .v6-nav-scrolled   .v6-nav-link:hover { color: #4f4941; }

  /* Right side */
  .v6-nav-right { display: flex; align-items: center; gap: 12px; }

  .v6-nav-cta {
    padding: 10px 22px; border-radius: 8px; border: none;
    font-family: 'Inter', sans-serif; font-size: 0.875rem; font-weight: 600;
    cursor: pointer; transition: all 0.3s; white-space: nowrap;
  }
  .v6-nav-transparent .v6-nav-cta {
    background: white; color: #453f39;
  }
  .v6-nav-transparent .v6-nav-cta:hover { background: #f8f7f4; }
  .v6-nav-scrolled   .v6-nav-cta {
    background: #4f4941; color: white;
  }
  .v6-nav-scrolled   .v6-nav-cta:hover { background: #453f39; }

  /* Hamburger */
  .v6-hamburger {
    display: none; background: none; border: none; cursor: pointer;
    padding: 6px; transition: color 0.3s;
  }
  .v6-nav-transparent .v6-hamburger { color: white; }
  .v6-nav-scrolled   .v6-hamburger { color: #374151; }

  /* Mobile dropdown */
  .v6-mobile-menu {
    background: rgba(255,255,255,0.98);
    backdrop-filter: blur(12px);
    border-top: 1px solid #e5e7eb;
    padding: 8px 16px 24px;
  }
  .v6-mobile-link {
    display: block; padding: 12px; border-radius: 8px;
    color: #374151; font-weight: 500; text-decoration: none;
    transition: background 0.2s; margin-bottom: 2px;
  }
  .v6-mobile-link:hover { background: #f8f7f4; color: #4f4941; }
  .v6-mobile-cta-btn {
    display: block; width: 100%; margin-top: 12px;
    padding: 14px; border-radius: 8px; border: none;
    background: #4f4941; color: white;
    font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600;
    cursor: pointer; transition: background 0.2s;
  }
  .v6-mobile-cta-btn:hover { background: #453f39; }

  @media (max-width: 1024px) {
    .v6-nav-links { display: none; }
    .v6-nav-cta { display: none; }
    .v6-hamburger { display: block; }
  }
`;

export default function V6NavMenu({
  orderId,
  companyName,
  companyLogo,
  showFeatures,
  showDescription,
  showPhotos,
  showFloorPlans,
  showVideo,
  showTours,
  showMap,
}: {
  orderId: string;
  companyName: string;
  companyLogo?: string | null;
  showFeatures: boolean;
  showDescription: boolean;
  showPhotos: boolean;
  showFloorPlans: boolean;
  showVideo: boolean;
  showTours: boolean;
  showMap: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showingOpen, setShowingOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '#details',     label: 'Details',      show: true },
    { href: '#features',    label: 'Features',     show: showFeatures },
    { href: '#description', label: 'Description',  show: showDescription },
    { href: '#photos',      label: 'Photos',       show: showPhotos },
    { href: '#floorplans',  label: 'Floor Plans',  show: showFloorPlans },
    { href: '#video',       label: 'Video',        show: showVideo },
    { href: '#tours',       label: 'Virtual Tour', show: showTours },
    { href: '#contact',     label: 'Contact',      show: true },
    { href: '#map',         label: 'Map',          show: showMap },
  ].filter((l) => l.show);

  const navClass = `v6-nav ${scrolled ? 'v6-nav-scrolled' : 'v6-nav-transparent'}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: V6_NAV_CSS }} />

      <nav className={navClass}>
        <div className="v6-nav-inner">
          {/* Logo / brand */}
          <a href="#overview" className="v6-nav-brand">
            {companyLogo ? (
              <Image
                src={companyLogo}
                alt={companyName || 'Agency'}
                width={120}
                height={36}
                style={{ height: '30px', width: 'auto', objectFit: 'contain' }}
                priority={false}
              />
            ) : (
              companyName || 'Property'
            )}
          </a>

          {/* Desktop nav links */}
          <div className="v6-nav-links">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="v6-nav-link">
                {l.label}
              </a>
            ))}
          </div>

          {/* Right: CTA + hamburger */}
          <div className="v6-nav-right">
            <button
              type="button"
              className="v6-nav-cta"
              onClick={() => setShowingOpen(true)}
            >
              Book a Showing
            </button>
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="v6-hamburger"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="v6-mobile-menu">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="v6-mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <button
              type="button"
              className="v6-mobile-cta-btn"
              onClick={() => {
                setMenuOpen(false);
                setShowingOpen(true);
              }}
            >
              Book a Showing
            </button>
          </div>
        )}
      </nav>

      <BookShowingPopup
        orderId={orderId}
        open={showingOpen}
        onClose={() => setShowingOpen(false)}
      />
    </>
  );
}
