'use client';

import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react';
import { XIcon } from '@/components/icons/XIcon';
import { TikTokIcon } from '@/components/icons/TikTokIcon';

/* ─────────────────────────────────────────────────────────────────
   V6RealtorCard
   Sticky realtor contact card used on desktop (bottom-right corner).
   "Send Message" scrolls to #contact section.
───────────────────────────────────────────────────────────────── */
export default function V6RealtorCard({
  realtorName,
  realtorPhoto,
  companyName,
  phone,
  email,
  facebookUrl,
  linkedinUrl,
  instagramUrl,
  youtubeUrl,
  twitterUrl,
  tiktokUrl,
}: {
  realtorName: string;
  realtorPhoto?: string | null;
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  twitterUrl?: string | null;
  tiktokUrl?: string | null;
}) {
  const phoneTel = phone
    ? `tel:${String(phone).replace(/[^+\d]/g, '')}`
    : undefined;

  const hasSocial =
    facebookUrl ||
    linkedinUrl ||
    instagramUrl ||
    youtubeUrl ||
    twitterUrl ||
    tiktokUrl;

  const card = (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow:
          '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        border: '1px solid #f3f4f6',
        overflow: 'hidden',
      }}
    >
      {/* Dark header */}
      <div
        style={{
          background: '#4f4941',
          padding: '24px',
          color: 'white',
        }}
      >
        <p
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            opacity: 0.75,
            marginBottom: '4px',
          }}
        >
          Listed By
        </p>
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.15rem',
            fontWeight: 700,
            margin: '0 0 2px',
          }}
        >
          {realtorName}
        </h3>
        {companyName && (
          <p style={{ fontSize: '0.85rem', opacity: 0.75, margin: 0 }}>
            {companyName}
          </p>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '24px' }}>
        {/* Realtor photo */}
        {realtorPhoto && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={realtorPhoto}
              alt={realtorName}
              style={{
                width: '64px', height: '64px', borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #ddd9cd',
                flexShrink: 0,
              }}
            />
            <div>
              <p style={{ fontWeight: 600, color: '#1f2937', margin: '0 0 2px', fontSize: '0.95rem' }}>
                {realtorName}
              </p>
              {companyName && (
                <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
                  {companyName}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Contact buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {phoneTel && (
            <a
              href={phoneTel}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '12px', background: '#f8f7f4',
                borderRadius: '10px', textDecoration: 'none',
                gap: '12px', transition: 'background 0.2s',
              }}
            >
              <span
                style={{
                  width: '38px', height: '38px', flexShrink: 0,
                  background: '#ddd9cd', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#4f4941" strokeWidth="2" width="17" height="17">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <div>
                <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: '0 0 1px' }}>Call Direct</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#453f39', margin: 0 }}>{phone}</p>
              </div>
            </a>
          )}

          {email && (
            <a
              href={`mailto:${email}`}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '12px', background: '#f8f7f4',
                borderRadius: '10px', textDecoration: 'none',
                gap: '12px',
              }}
            >
              <span
                style={{
                  width: '38px', height: '38px', flexShrink: 0,
                  background: '#ddd9cd', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#4f4941" strokeWidth="2" width="17" height="17">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <div>
                <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: '0 0 1px' }}>Email</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#453f39', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                  {email}
                </p>
              </div>
            </a>
          )}
        </div>

        {/* Send Message button */}
        <button
          type="button"
          onClick={() =>
            document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })
          }
          style={{
            width: '100%', padding: '12px',
            background: '#4f4941', color: 'white',
            border: 'none', borderRadius: '10px',
            fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.2s',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            marginBottom: '16px',
          }}
        >
          Send Message
        </button>

        {/* Social links */}
        {hasSocial && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
            {facebookUrl && (
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer"
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4f4941', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                <Facebook size={15} />
              </a>
            )}
            {linkedinUrl && (
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4f4941', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                <Linkedin size={15} />
              </a>
            )}
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4f4941', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                <Instagram size={15} />
              </a>
            )}
            {youtubeUrl && (
              <a href={youtubeUrl} target="_blank" rel="noopener noreferrer"
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4f4941', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                <Youtube size={15} />
              </a>
            )}
            {twitterUrl && (
              <a href={twitterUrl} target="_blank" rel="noopener noreferrer" aria-label="Twitter/X"
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4f4941', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                <XIcon width={15} height={15} />
              </a>
            )}
            {tiktokUrl && (
              <a href={tiktokUrl} target="_blank" rel="noopener noreferrer"
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4f4941', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                <TikTokIcon width={15} height={15} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Just render the card.
  // The parent wrapper in PropertyTemplateV6 (.v6-realtor-sticky) controls
  // show/hide via CSS media query (visible on desktop ≥1024px).
  return card;
}
