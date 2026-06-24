'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import BookShowingPopup from '@/components/property/BookShowingPopup';

export default function V4NavMenu({
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

  const links = [
    { href: '#details', label: 'Details', show: true },
    { href: '#features', label: 'Features', show: showFeatures },
    { href: '#description', label: 'Description', show: showDescription },
    { href: '#gallery', label: 'Photos', show: showPhotos },
    { href: '#floorplans', label: 'Floor Plans', show: showFloorPlans },
    { href: '#video', label: 'Video', show: showVideo },
    { href: '#tour', label: 'Virtual Tour', show: showTours },
    { href: '#contact', label: 'Contact', show: true },
    { href: '#map', label: 'Map', show: showMap },
  ].filter((l) => l.show);

  return (
    <>
      {/* ── Inline scoped styles for the nav ─────────────────── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .v4-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 16px 48px;
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(245,240,232,0.93);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(184,149,90,0.25);
          transition: box-shadow 0.3s ease, padding 0.2s ease;
        }
        .v4-nav-left { display: flex; align-items: center; gap: 10px; }
        .v4-nav-brand {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px; font-weight: 300;
          letter-spacing: 0.04em;
          color: #1A1714; text-decoration: none;
        }
        .v4-nav-right { display: flex; align-items: center; gap: 0; }
        .v4-nav-links {
          display: flex; gap: 24px; list-style: none; margin: 0; padding: 0;
        }
        .v4-nav-links a {
          font-size: 11px; font-weight: 400;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #8A8278; text-decoration: none;
          transition: color 0.2s;
        }
        .v4-nav-links a:hover { color: #B8955A; }
        .v4-nav-cta {
          background: #1A1714; color: #F5F0E8 !important;
          padding: 9px 20px !important; border: none;
          font-size: 11px !important;
          letter-spacing: 0.12em !important;
          text-transform: uppercase;
          cursor: pointer; transition: background 0.2s;
          text-decoration: none; white-space: nowrap;
          font-family: 'Instrument Sans', sans-serif;
          display: inline-block;
        }
        .v4-nav-cta:hover { background: #B8955A !important; color: #F5F0E8 !important; }
        .v4-nav-cta-desktop { margin-left: 24px; flex-shrink: 0; }
        .v4-hamburger {
          display: none;
          align-items: center; justify-content: center;
          background: rgba(26,23,20,0.06);
          border: 1px solid rgba(184,149,90,0.25);
          padding: 8px; cursor: pointer;
          color: #1A1714;
        }
        .v4-mobile-dropdown {
          display: none;
          position: fixed; top: 0; right: 0; z-index: 101;
          width: 280px; max-width: 85vw; height: 100vh;
          background: #F5F0E8;
          border-left: 1px solid rgba(184,149,90,0.25);
          padding: 20px 24px;
          flex-direction: column; gap: 0;
          box-shadow: -4px 0 24px rgba(0,0,0,0.12);
          overflow-y: auto;
          transform: translateX(100%);
          transition: transform 0.3s ease;
        }
        .v4-mobile-dropdown.open { transform: translateX(0); display: flex; }
        .v4-mobile-overlay {
          display: none;
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.35);
        }
        .v4-mobile-overlay.open { display: block; }
        .v4-mobile-close {
          align-self: flex-end;
          background: none; border: 1px solid rgba(184,149,90,0.25);
          padding: 8px; cursor: pointer;
          color: #1A1714; margin-bottom: 20px;
          flex-shrink: 0;
        }
        .v4-mobile-links {
          display: flex; flex-direction: column; gap: 0;
        }
        .v4-mobile-links a {
          font-size: 12px; font-weight: 400;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #8A8278; text-decoration: none;
          padding: 12px 0;
          border-bottom: 1px solid rgba(184,149,90,0.1);
          transition: color 0.2s;
        }
        .v4-mobile-links a:hover { color: #B8955A; }
        .v4-mobile-cta {
          margin-top: 20px;
          background: #1A1714; color: #F5F0E8 !important;
          padding: 14px 24px !important;
          font-size: 11px !important;
          letter-spacing: 0.18em !important;
          text-transform: uppercase;
          cursor: pointer; border: none;
          text-align: center;
          font-family: 'Instrument Sans', sans-serif;
          text-decoration: none;
        }
        .v4-mobile-cta:hover { background: #B8955A !important; }
        @media (max-width: 900px) {
          .v4-nav { padding: 14px 20px; }
          .v4-nav-links { display: none; }
          .v4-nav-cta-desktop { display: none !important; }
          .v4-hamburger { display: flex; }
        }
      `,
        }}
      />

      <nav className="v4-nav">
        {/* Left: agency logo + brand text */}
        <div className="v4-nav-left">
          {companyLogo && (
            <Image
              src={companyLogo}
              alt={companyName || 'Agency logo'}
              width={100}
              height={36}
              style={{ width: 'auto', height: '28px', objectFit: 'contain' }}
              priority={false}
            />
          )}
          {!companyLogo && (
            <span className="v4-nav-brand">{companyName || 'Property'}</span>
          )}
        </div>

        {/* Right: desktop links + CTA */}
        <div className="v4-nav-right">
          <ul className="v4-nav-links">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setShowingOpen(true)}
            className="v4-nav-cta v4-nav-cta-desktop"
          >
            Book a Showing
          </button>

          {/* Hamburger button (mobile only) */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="v4-hamburger"
          >
            <Menu width={20} height={20} />
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="v4-mobile-overlay open"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`v4-mobile-dropdown${menuOpen ? ' open' : ''}`}>
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="v4-mobile-close"
        >
          <X width={18} height={18} />
        </button>

        <div className="v4-mobile-links">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          className="v4-mobile-cta"
          onClick={() => {
            setMenuOpen(false);
            setShowingOpen(true);
          }}
        >
          Book a Showing
        </button>
      </aside>

      <BookShowingPopup
        orderId={orderId}
        open={showingOpen}
        onClose={() => setShowingOpen(false)}
      />
    </>
  );
}
