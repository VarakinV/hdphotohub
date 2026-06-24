'use client';

import { useState } from 'react';
import Image from 'next/image';
import BookShowingPopup from '@/components/property/BookShowingPopup';

export default function V5NavMenu({
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

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .v5-navbar {
          position: fixed; top: 0; left: 0; width: 100%; z-index: 1000;
          background: rgba(255, 255, 255, 0.97);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #E2E8F0;
          height: 70px;
        }
        .v5-nav-container {
          max-width: 1200px; margin: 0 auto; padding: 0 20px;
          display: flex; justify-content: space-between; align-items: center;
          height: 70px;
        }
        .v5-nav-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.3rem; font-weight: 700; color: #0F172A;
          text-decoration: none; display: flex; align-items: center;
        }
        .v5-nav-center { display: flex; align-items: center; }
        .v5-nav-links {
          display: flex; list-style: none; gap: 24px; margin: 0; padding: 0;
        }
        .v5-nav-links a {
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem; font-weight: 500; color: #334155;
          text-decoration: none; position: relative;
          transition: color 0.25s;
        }
        .v5-nav-links a::after {
          content: ''; position: absolute; bottom: -4px; left: 0;
          width: 0; height: 2px; background: #B48E5A;
          transition: width 0.25s ease;
        }
        .v5-nav-links a:hover { color: #B48E5A; }
        .v5-nav-links a:hover::after { width: 100%; }

        .v5-nav-actions { display: flex; align-items: center; gap: 12px; }
        .v5-nav-cta {
          background: #B48E5A; color: white;
          border: none; padding: 9px 20px;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem; font-weight: 600;
          cursor: pointer; transition: background 0.25s, transform 0.2s;
          white-space: nowrap;
        }
        .v5-nav-cta:hover { background: #9A7748; transform: translateY(-1px); }

        /* Hamburger */
        .v5-nav-links-cta-item { display: none; }

        .v5-hamburger {
          display: none; flex-direction: column; gap: 5px;
          cursor: pointer; background: none; border: none; padding: 4px;
        }
        .v5-hamburger span {
          width: 24px; height: 2px; background: #0F172A;
          border-radius: 2px; display: block;
          transition: all 0.3s ease;
        }
        .v5-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .v5-hamburger.open span:nth-child(2) { opacity: 0; }
        .v5-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* Mobile nav dropdown */
        @media (max-width: 900px) {
          .v5-nav-links {
            position: fixed; top: 70px; left: 0; width: 100%;
            background: white; flex-direction: column; align-items: center;
            padding: 24px 0; gap: 0;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            transform: translateY(-110%);
            transition: transform 0.3s ease;
            z-index: 998;
          }
          .v5-nav-links.open { transform: translateY(0); }
          .v5-nav-links li { width: 100%; text-align: center; }
          .v5-nav-links a {
            display: block; padding: 14px 20px;
            font-size: 0.95rem;
            border-bottom: 1px solid #F1F5F9;
          }
          .v5-nav-links a::after { display: none; }
          .v5-nav-links-cta-item { display: block; padding: 16px 20px; }
          .v5-nav-links-cta-item button {
            width: 100%; background: #B48E5A; color: white;
            border: none; padding: 12px;
            border-radius: 8px;
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem; font-weight: 600; cursor: pointer;
          }
          .v5-nav-links-cta-item a { display: none; }
          .v5-nav-cta-desktop { display: none !important; }
          .v5-hamburger { display: flex; }
        }
      `,
        }}
      />

      <header className="v5-navbar">
        <div className="v5-nav-container">
          {/* Left: agency logo or text */}
          <a href="#details" className="v5-nav-logo">
            {companyLogo ? (
              <Image
                src={companyLogo}
                alt={companyName || 'Agency'}
                width={120}
                height={40}
                style={{ height: '30px', width: 'auto', objectFit: 'contain' }}
                priority={false}
              />
            ) : (
              <span>{companyName || 'Property'}</span>
            )}
          </a>

          {/* Centre: desktop nav links */}
          <nav className="v5-nav-center">
            <ul className={`v5-nav-links${menuOpen ? ' open' : ''}`}>
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={() => setMenuOpen(false)}>
                    {l.label}
                  </a>
                </li>
              ))}
              {/* Mobile-only CTA inside dropdown */}
              <li className="v5-nav-links-cta-item">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowingOpen(true);
                  }}
                >
                  Book a Showing
                </button>
              </li>
            </ul>
          </nav>

          {/* Right: desktop CTA + hamburger */}
          <div className="v5-nav-actions">
            <button
              type="button"
              className="v5-nav-cta v5-nav-cta-desktop"
              onClick={() => setShowingOpen(true)}
            >
              Book a Showing
            </button>
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className={`v5-hamburger${menuOpen ? ' open' : ''}`}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <BookShowingPopup
        orderId={orderId}
        open={showingOpen}
        onClose={() => setShowingOpen(false)}
      />
    </>
  );
}
