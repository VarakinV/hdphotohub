import { PhotoLightbox } from '@/components/delivery/PhotoLightbox';
import ContactForm from '@/components/property/ContactForm';
import HeroSlider from '@/components/property/HeroSlider';
import V6NavMenu from '@/components/property/templates/V6NavMenu';
import V6RealtorCard from '@/components/property/templates/V6RealtorCard';
import V6FloorPlanCard from '@/components/property/templates/V6FloorPlanCard';
import V6MobileBar from '@/components/property/templates/V6MobileBar';
import HeroBookCTA from '@/components/property/templates/HeroBookCTA';
import V4GalleryTrigger from '@/components/property/templates/V4GalleryTrigger';
import { sanitizeDescription } from '@/lib/sanitize';
import MapWithMarker from '@/components/property/MapWithMarker';
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  BedDouble,
  Bath,
  Maximize,
  CalendarDays,
  Hash,
  Tag,
  Check,
} from 'lucide-react';
import { XIcon } from '@/components/icons/XIcon';
import { TikTokIcon } from '@/components/icons/TikTokIcon';

/* ─────────────────────────────────────────────────────────────────
   V6 SCOPED STYLES
   Palette: warm sand/brown (brand-800: #4f4941, brand-600: #756d60)
   Fonts:   Playfair Display (headings) · Inter (body)
   Classes: all prefixed "v6-"
   Layout:  sticky realtor card on desktop → main has right padding
───────────────────────────────────────────────────────────────── */
const V6_STYLES = `
  /* ── Variables & base ──────────────────────────── */
  .v6 {
    --v6-brand-50:  #f8f7f4;
    --v6-brand-100: #efede6;
    --v6-brand-200: #ddd9cd;
    --v6-brand-300: #c4bfb3;
    --v6-brand-600: #756d60;
    --v6-brand-700: #5e574d;
    --v6-brand-800: #4f4941;
    --v6-brand-900: #453f39;
    --v6-gray-50:  #f9fafb;
    --v6-gray-100: #f3f4f6;
    --v6-gray-200: #e5e7eb;
    --v6-gray-300: #d1d5db;
    --v6-gray-400: #9ca3af;
    --v6-gray-500: #6b7280;
    --v6-gray-600: #4b5563;
    --v6-gray-700: #374151;
    --v6-gray-800: #1f2937;
    --v6-gray-900: #111827;
    --v6-accent:   #0ea5e9;
    font-family: 'Inter', sans-serif;
    color: var(--v6-gray-800);
    background: white;
    -webkit-font-smoothing: antialiased;
    line-height: 1.6;
    overflow-x: hidden;
  }

  /* ── Layout helpers ─────────────────────────────── */
  .v6-container { width: 100%; max-width: 1280px; margin: 0 auto; padding: 0 20px; }
  .v6-section { padding: 80px 0; scroll-margin-top: 80px; }
  .v6-serif { font-family: 'Playfair Display', serif; }

  /* ── Section labels (centred with lines) ───────── */
  .v6-section-label {
    display: flex; align-items: center; margin-bottom: 48px;
  }
  .v6-section-label::before,
  .v6-section-label::after {
    content: ''; flex: 1; height: 1px; background: var(--v6-brand-300);
  }
  .v6-section-label span {
    padding: 0 16px;
    font-size: 0.72rem; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--v6-brand-600);
  }
  .v6-section-h {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.8rem, 4vw, 2.4rem);
    font-weight: 700; color: var(--v6-gray-900);
    text-align: center; line-height: 1.2; margin-bottom: 12px;
  }
  .v6-section-sub {
    color: var(--v6-gray-500); text-align: center;
    font-size: 1rem; margin-bottom: 48px;
    max-width: 640px; margin-left: auto; margin-right: auto;
  }

  /* ── Hero ───────────────────────────────────────── */
  .v6-hero {
    position: relative;
    height: 100vh;
    min-height: 600px; max-height: 900px;
    overflow: hidden;
    display: flex; align-items: flex-end;
  }
  .v6-hero-gradient {
    position: absolute; inset: 0; z-index: 2; pointer-events: none;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.6) 0%,
      rgba(0,0,0,0.25) 45%,
      rgba(0,0,0,0.6) 100%
    );
  }
  .v6-hero-body {
    position: relative; z-index: 3; width: 100%;
    padding: 0 20px 96px; max-width: 1280px; margin: 0 auto;
    pointer-events: none;
  }
  .v6-hero-body > * { pointer-events: auto; }

  .v6-hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px;
    background: rgba(255,255,255,0.18);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.28);
    border-radius: 999px;
    color: white; font-size: 0.85rem; font-weight: 500;
    margin-bottom: 24px;
  }
  .v6-hero-badge-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #4ade80; flex-shrink: 0;
  }

  .v6-hero-address {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 7vw, 4.5rem);
    font-weight: 700; color: white;
    line-height: 1.05; margin: 0 0 12px;
    letter-spacing: -0.02em;
  }
  .v6-hero-city {
    font-size: clamp(1rem, 2.5vw, 1.35rem);
    color: rgba(255,255,255,0.85);
    font-weight: 300; margin: 0 0 32px;
  }
  .v6-hero-stats {
    display: flex; flex-wrap: wrap; gap: 24px 40px;
    margin-bottom: 40px;
  }
  .v6-hero-stat {
    display: flex; align-items: center; gap: 8px;
    color: rgba(255,255,255,0.88); font-size: 1rem;
  }
  .v6-hero-stat svg { flex-shrink: 0; }
  .v6-hero-stat strong { font-weight: 600; }

  .v6-hero-bottom {
    display: flex; flex-wrap: wrap;
    align-items: center; gap: 24px;
  }
  .v6-hero-price-label {
    font-size: 0.7rem; letter-spacing: 0.15em;
    text-transform: uppercase; color: rgba(255,255,255,0.65);
    margin-bottom: 4px;
  }
  .v6-hero-price {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 700; color: white; line-height: 1;
  }
  .v6-hero-cta-wrap { display: flex; gap: 16px; flex-wrap: wrap; }
  .v6-hero-cta-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 28px;
    background: white; color: #4f4941;
    font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600;
    border-radius: 10px; text-decoration: none;
    transition: background 0.2s; box-shadow: 0 4px 14px rgba(0,0,0,0.15);
  }
  .v6-hero-cta-primary:hover { background: #f8f7f4; }

  /* Scroll indicator */
  .v6-scroll-hint {
    position: absolute; bottom: 32px; left: 50%;
    transform: translateX(-50%); z-index: 3;
    color: rgba(255,255,255,0.65);
    animation: v6bounce 2s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes v6bounce {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    50%       { transform: translateX(-50%) translateY(6px); }
  }

  /* ── Sticky realtor card — desktop, bottom-right ── */
  .v6-realtor-sticky {
    display: none;
    position: fixed; right: 32px; bottom: 32px;
    z-index: 40; width: 300px;
  }
  @media (min-width: 1024px) { .v6-realtor-sticky { display: block; } }

  /* ── Mobile sticky bar — visible below 1024px ───── */
  .v6-mobile-bar {
    display: none;
    position: fixed; bottom: 0; left: 0; right: 0;
    z-index: 50;
    background: white;
    border-top: 1px solid var(--v6-gray-200);
    padding: 12px 16px;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  }
  @media (max-width: 1023px) { .v6-mobile-bar { display: block; } }
  .v6-mobile-bar-inner {
    display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
    max-width: 640px; margin: 0 auto;
  }
  .v6-mobile-bar-info { flex: 1; min-width: 0; }
  .v6-mobile-bar-by {
    font-size: 0.72rem; color: var(--v6-gray-500);
    margin: 0 0 2px; line-height: 1.35;
  }
  .v6-mobile-bar-price {
    font-size: 0.95rem; font-weight: 700;
    color: var(--v6-brand-900); margin: 0;
    white-space: nowrap;
  }
  .v6-mobile-bar-actions { display: flex; gap: 8px; flex-shrink: 0; }
  .v6-mobile-bar-call {
    padding: 9px 16px;
    background: var(--v6-brand-800); color: white;
    border-radius: 8px; font-size: 0.82rem; font-weight: 600;
    text-decoration: none; white-space: nowrap;
    transition: background 0.2s;
  }
  .v6-mobile-bar-call:hover { background: var(--v6-brand-900); }
  .v6-mobile-bar-message {
    padding: 9px 16px;
    border: 2px solid var(--v6-brand-800); color: var(--v6-brand-800);
    background: transparent; border-radius: 8px;
    font-size: 0.82rem; font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer; white-space: nowrap;
    transition: background 0.2s;
  }
  .v6-mobile-bar-message:hover { background: var(--v6-brand-50); }

  /* ── Main content (right shift for sticky card) ── */
  .v6-main {
    max-width: 1280px; margin: 0 auto; padding: 0 20px;
  }
  @media (min-width: 1024px) {
    .v6-main { padding-right: 352px; } /* card 300px + gap 52px */
  }

  /* ── Details section ────────────────────────────── */
  .v6-details-grid { display: block; }

  .v6-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px; margin-bottom: 32px;
  }
  .v6-stat-card {
    text-align: center; padding: 16px 12px;
    background: var(--v6-brand-50); border-radius: 12px;
  }
  .v6-stat-icon { color: var(--v6-brand-600); margin-bottom: 8px; }
  .v6-stat-val {
    font-size: 1.5rem; font-weight: 700; color: var(--v6-gray-900);
    display: block; line-height: 1;
  }
  .v6-stat-label { font-size: 0.78rem; color: var(--v6-gray-500); display: block; margin-top: 4px; }

  .v6-info-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
  }
  .v6-info-item {
    display: flex; align-items: center; gap: 12px;
    padding: 14px; border: 1px solid var(--v6-gray-200); border-radius: 10px;
  }
  .v6-info-icon { color: var(--v6-brand-600); flex-shrink: 0; }
  .v6-info-label { font-size: 0.78rem; color: var(--v6-gray-500); }
  .v6-info-val { font-weight: 600; color: var(--v6-gray-900); font-size: 0.95rem; }

  .v6-description {
    font-size: 1.05rem; color: var(--v6-gray-600);
    line-height: 1.8; margin-bottom: 32px;
  }
  .v6-description p { margin-bottom: 16px; }
  .v6-description h1, .v6-description h2, .v6-description h3 {
    font-family: 'Playfair Display', serif; color: var(--v6-gray-900);
    margin-bottom: 12px;
  }

  /* ── Features ──────────────────────────────────── */
  .v6-features-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 12px;
  }
  @media (min-width: 640px) {
    .v6-features-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 1024px) {
    .v6-features-grid { grid-template-columns: repeat(3, 1fr); }
  }
  .v6-feature-item {
    display: flex; align-items: center; gap: 14px;
    padding: 16px; border: 1px solid var(--v6-gray-200);
    border-radius: 12px; background: white;
    transition: border-color 0.2s, box-shadow 0.2s;
    cursor: default;
  }
  .v6-feature-item:hover {
    border-color: var(--v6-brand-300);
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }
  .v6-feature-icon-wrap {
    width: 36px; height: 36px; flex-shrink: 0;
    background: var(--v6-brand-100); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: var(--v6-brand-700);
  }
  .v6-feature-text { font-size: 0.9rem; color: var(--v6-gray-700); font-weight: 500; }

  /* ── Gallery masonry ───────────────────────────── */
  .v6-masonry {
    columns: 1; column-gap: 1rem;
  }
  @media (min-width: 640px)  { .v6-masonry { columns: 2; } }
  @media (min-width: 1024px) { .v6-masonry { columns: 3; } }

  .v6-masonry-item {
    break-inside: avoid;
    margin-bottom: 1rem;
    border-radius: 12px; overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    cursor: pointer; display: block;
  }
  /* PhotoLightbox wrapper fills masonry item */
  .v6-masonry-item > div { display: block; width: 100%; }
  .v6-masonry-item img {
    width: 100%; height: auto; display: block;
    transition: transform 0.5s ease;
  }
  .v6-masonry-item:hover img { transform: scale(1.04); }

  /* View All button (V4GalleryTrigger, V6-themed) */
  .v4-view-all-wrap { margin-top: 40px; text-align: center; }
  .v4-view-all-btn {
    display: inline-flex; align-items: center; gap: 8px;
    border: 2px solid var(--v6-brand-800); color: var(--v6-brand-800);
    background: transparent;
    padding: 13px 30px; border-radius: 10px;
    font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600;
    cursor: pointer; transition: all 0.25s;
  }
  .v4-view-all-btn:hover { background: var(--v6-brand-800); color: white; }

  /* ── Floor plans ───────────────────────────────── */
  .v6-fp-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 28px;
  }
  @media (max-width: 640px) { .v6-fp-grid { grid-template-columns: 1fr; } }

  .v6-fp-card {
    background: white; border-radius: 12px;
    border: 1px solid var(--v6-gray-200);
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08);
    overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .v6-fp-card:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
  .v6-fp-img { overflow: hidden; }
  .v6-fp-img > div { width: 100%; }
  .v6-fp-thumb {
    width: 100%; height: 240px !important; object-fit: cover !important;
    display: block; transition: transform 0.5s ease; cursor: pointer;
  }
  .v6-fp-img:hover .v6-fp-thumb { transform: scale(1.05); }
  .v6-fp-info { padding: 20px; }
  .v6-fp-title {
    font-size: 1rem; font-weight: 600; color: var(--v6-gray-900);
    margin: 0 0 10px;
  }
  .v6-fp-btn {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.85rem; font-weight: 500; color: var(--v6-brand-700);
    background: none; border: none; padding: 0;
    cursor: pointer; font-family: inherit;
    transition: color 0.2s;
  }
  .v6-fp-btn:hover { color: var(--v6-brand-900); text-decoration: underline; }

  /* ── Video ─────────────────────────────────────── */
  .v6-video-wrap {
    background: var(--v6-gray-900);
    border-radius: 16px; overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
  }
  .v6-video-embed {
    position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;
  }
  .v6-video-embed video {
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%; object-fit: contain; border: 0;
  }

  /* ── Virtual tour ──────────────────────────────── */
  .v6-tour-wrap {
    background: var(--v6-gray-100);
    border-radius: 16px; overflow: hidden;
    border: 1px solid var(--v6-gray-200);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08);
  }
  .v6-tour-embed {
    position: relative; padding-bottom: 60%; height: 0; overflow: hidden;
  }
  .v6-tour-embed iframe {
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%; border: 0;
  }
  .v6-tour-footer {
    padding: 20px 24px;
    background: white;
    display: flex; align-items: center;
    border-top: 1px solid var(--v6-gray-200);
  }
  .v6-tour-icon-wrap {
    width: 40px; height: 40px; flex-shrink: 0;
    background: #e0f2fe; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin-right: 12px; color: #0284c7;
  }
  .v6-tour-title { font-weight: 600; color: var(--v6-gray-900); font-size: 0.95rem; }
  .v6-tour-sub { font-size: 0.8rem; color: var(--v6-gray-500); }

  /* ── Map ───────────────────────────────────────── */
  .v6-map-wrap {
    background: white;
    border-radius: 16px; overflow: hidden;
    border: 1px solid var(--v6-gray-200);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08);
  }
  .v6-map-inner { height: 450px; }
  .v6-map-inner > div { height: 100% !important; }

  /* ── Contact ───────────────────────────────────── */
  .v6-contact-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 48px;
  }
  @media (max-width: 900px) { .v6-contact-grid { grid-template-columns: 1fr; gap: 32px; } }

  .v6-contact-tile {
    display: flex; align-items: center; gap: 16px;
    padding: 16px; background: var(--v6-brand-50);
    border-radius: 12px;
  }
  .v6-contact-tile-icon {
    width: 48px; height: 48px; flex-shrink: 0;
    background: var(--v6-brand-200); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: var(--v6-brand-800);
  }
  .v6-contact-tile-label { font-size: 0.8rem; color: var(--v6-gray-500); }
  .v6-contact-tile a {
    font-size: 1rem; font-weight: 600; color: var(--v6-brand-900);
    text-decoration: none; transition: color 0.2s;
  }
  .v6-contact-tile a:hover { color: var(--v6-brand-700); }

  .v6-social-links { display: flex; gap: 12px; flex-wrap: wrap; }
  .v6-social-btn {
    width: 44px; height: 44px;
    background: var(--v6-brand-800); color: white;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    text-decoration: none; transition: background 0.2s;
  }
  .v6-social-btn:hover { background: var(--v6-brand-700); }

  /* ContactForm overrides */
  .v6-form-wrap { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid var(--v6-gray-200); }
  .v6-form-title { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 700; color: var(--v6-gray-900); margin: 0 0 6px; }
  .v6-form-sub { font-size: 0.9rem; color: var(--v6-gray-500); margin-bottom: 24px; display: block; }
  .v6-form-wrap input, .v6-form-wrap textarea {
    border-radius: 8px !important;
    font-family: 'Inter', sans-serif !important;
  }
  .v6-form-wrap input:focus, .v6-form-wrap textarea:focus {
    border-color: #5e574d !important;
    box-shadow: 0 0 0 3px rgba(95,87,77,0.12) !important;
  }
  .v6-form-wrap button[type="submit"] {
    background: var(--v6-brand-800) !important;
    border-radius: 10px !important;
    font-family: 'Inter', sans-serif !important; font-weight: 600 !important;
  }
  .v6-form-wrap button[type="submit"]:hover:not(:disabled) { background: var(--v6-brand-900) !important; }

  /* ── Footer ────────────────────────────────────── */
  .v6-footer { background: var(--v6-gray-900); color: #9ca3af; padding: 56px 0 28px; margin-top: 80px; }
  .v6-footer-top {
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 24px;
    margin-bottom: 32px; padding-bottom: 32px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .v6-footer-links { display: flex; gap: 24px; }
  .v6-footer-links a { color: #9ca3af; text-decoration: none; font-size: 0.875rem; transition: color 0.2s; }
  .v6-footer-links a:hover { color: white; }
  .v6-footer-legal p { font-size: 0.78rem; color: #4b5563; line-height: 1.8; margin-bottom: 10px; }
  .v6-footer-bottom {
    margin-top: 24px; display: flex; flex-wrap: wrap;
    align-items: center; justify-content: space-between;
    gap: 12px; font-size: 0.82rem; color: #4b5563;
  }
  .v6-footer-bottom a { color: #6b7280; text-decoration: none; transition: color 0.2s; }
  .v6-footer-bottom a:hover { color: white; }

  /* ── Responsive ────────────────────────────────── */
  @media (max-width: 1023px) {
    .v6 { padding-bottom: 72px; } /* clear the fixed mobile bar */
  }
  @media (max-width: 768px) {
    .v6-section { padding: 56px 0; }
    .v6-stats-grid { grid-template-columns: repeat(2, 1fr); }
    .v6-info-grid { grid-template-columns: 1fr; }
    .v6-hero-body { padding: 0 16px 80px; }
    .v6-footer-top { flex-direction: column; align-items: flex-start; gap: 20px; }
    .v6-footer-bottom { flex-direction: column; align-items: flex-start; }
  }
  @media (max-width: 640px) {
    .v6-hero-stats { gap: 16px 24px; }
    .v6-hero-price { font-size: 1.8rem; }
  }
`;

export default function PropertyTemplateV6({
  order,
  baseUrl,
}: {
  order: any;
  baseUrl: string;
}) {
  const realtorName = `${order.realtor.firstName} ${order.realtor.lastName}`;
  const fullUrl    = `${baseUrl}/property/${order.id}/v6`;

  /* ── Address ────────────────────────────────────── */
  const formatted: string =
    order.propertyFormattedAddress ||
    order.propertyAddressOverride ||
    order.propertyAddress ||
    '';
  const street: string =
    (order.propertyAddressOverride &&
      order.propertyAddressOverride.split(',')[0]) ||
    (order.propertyAddress && order.propertyAddress.split(',')[0]) ||
    (formatted && formatted.split(',')[0]) ||
    '';
  const cityLine: string =
    [
      order.propertyCityOverride || order.propertyCity,
      order.propertyProvince,
      order.propertyPostalCodeOverride || order.propertyPostalCode,
    ]
      .filter(Boolean)
      .join(', ') ||
    (formatted
      ? formatted.split(',').slice(1, 3).map((s: string) => s.trim()).filter(Boolean).join(', ')
      : '');

  const phoneTel = order.realtor.phone
    ? `tel:${String(order.realtor.phone).replace(/[^+\d]/g, '')}`
    : undefined;
  const priceFormatted = order.listPrice
    ? `$${Number(order.listPrice).toLocaleString()}`
    : undefined;

  /* ── Photos ─────────────────────────────────────── */
  const photos = order.photos || [];
  const photoItems = photos.map((p: any) => ({
    src: p.urlMls || p.url,
    alt: p.filename,
  }));

  /* ── Floor plans ─────────────────────────────────── */
  const floorPlans    = order.floorPlans || [];
  const floorPlanItems = floorPlans.map((fp: any) => ({ src: fp.url, alt: fp.filename }));

  /* ── Embeds ─────────────────────────────────────── */
  const iguide =
    (order.embeds || []).find((e: any) => /iguide|matterport|tour/i.test(e.embedUrl)) ||
    (order.embeds || [])[0];

  /* ── Features ────────────────────────────────────── */
  const features: string[] = order.featuresText
    ? String(order.featuresText).split(/\r?\n/).map((ln: string) => ln.trim()).filter(Boolean)
    : [];

  /* ── Flags ──────────────────────────────────────── */
  const showFeatures    = features.length > 0;
  const showDescription = Boolean(order.description);
  const showPhotos      = photos.length > 0;
  const showFloorPlans  = floorPlans.length > 0;
  const showVideo       = (order.videos || []).length > 0;
  const showTours       = Boolean(iguide);
  const showMap         = order.propertyLat != null && order.propertyLng != null;
  const hasSocial       =
    order.realtor.facebookUrl ||
    order.realtor.linkedinUrl ||
    order.realtor.instagramUrl ||
    order.realtor.youtubeUrl ||
    order.realtor.twitterUrl ||
    order.realtor.tiktokUrl;

  return (
    <>
      {/* ── Google Fonts ─────────────────────────────── */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: V6_STYLES }} />

      <div className="v6">

        {/* ══ NAV ══════════════════════════════════════════════ */}
        <V6NavMenu
          orderId={order.id}
          companyName={order.realtor.companyName || 'Property'}
          companyLogo={order.realtor.companyLogo}
          showFeatures={showFeatures}
          showDescription={showDescription}
          showPhotos={showPhotos}
          showFloorPlans={showFloorPlans}
          showVideo={showVideo}
          showTours={showTours}
          showMap={showMap}
        />

        {/* ══ STICKY REALTOR CARD (desktop) ════════════════════ */}
        <div className="v6-realtor-sticky">
          <V6RealtorCard
            realtorName={realtorName}
            realtorPhoto={order.realtor.headshot}
            companyName={order.realtor.companyName}
            phone={order.realtor.phone}
            email={order.realtor.email}
            facebookUrl={order.realtor.facebookUrl}
            linkedinUrl={order.realtor.linkedinUrl}
            instagramUrl={order.realtor.instagramUrl}
            youtubeUrl={order.realtor.youtubeUrl}
            twitterUrl={order.realtor.twitterUrl}
            tiktokUrl={order.realtor.tiktokUrl}
          />
        </div>

        {/* ══ HERO ══════════════════════════════════════════════ */}
        <section className="v6-hero" id="overview">
          {/* Slideshow background */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <HeroSlider
              images={photos.map((p: any) => p.urlMls || p.url)}
              url={fullUrl}
              title={street}
              className="h-full"
            />
          </div>

          {/* Gradient overlay */}
          <div className="v6-hero-gradient" />

          {/* Content at bottom */}
          <div style={{ position: 'relative', zIndex: 3, width: '100%', pointerEvents: 'none' }}>
            <div className="v6-hero-body">
              {/* For Sale badge */}
              <div className="v6-hero-badge">
                <span className="v6-hero-badge-dot" />
                For Sale
              </div>

              {/* Address */}
              <h1 className="v6-hero-address">{street}</h1>
              {cityLine && <p className="v6-hero-city">{cityLine}</p>}

              {/* Quick stats */}
              <div className="v6-hero-stats">
                {order.bedrooms && (
                  <div className="v6-hero-stat">
                    <BedDouble size={18} />
                    <strong>{order.bedrooms}</strong>&nbsp;Beds
                  </div>
                )}
                {order.bathrooms && (
                  <div className="v6-hero-stat">
                    <Bath size={18} />
                    <strong>{order.bathrooms}</strong>&nbsp;Baths
                  </div>
                )}
                {order.propertySize && (
                  <div className="v6-hero-stat">
                    <Maximize size={18} />
                    <strong>{order.propertySize}</strong>&nbsp;Sq Ft
                  </div>
                )}
                {order.yearBuilt && (
                  <div className="v6-hero-stat">
                    <CalendarDays size={18} />
                    Built&nbsp;<strong>{order.yearBuilt}</strong>
                  </div>
                )}
              </div>

              {/* Price + CTA */}
              <div className="v6-hero-bottom">
                {priceFormatted && (
                  <div>
                    <p className="v6-hero-price-label">Listing Price</p>
                    <p className="v6-hero-price">{priceFormatted}</p>
                  </div>
                )}
                <HeroBookCTA orderId={order.id} />
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="v6-scroll-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </section>

        {/* ══ MAIN CONTENT ══════════════════════════════════════ */}
        <main className="v6-main">

          {/* ── PROPERTY DETAILS ────────────────────── */}
          <section id="details" className="v6-section">
            <div className="v6-section-label">
              <span>Property Details</span>
            </div>
            <div className="v6-details-grid">
              {/* Left: info */}
              <div>
                {showDescription && (
                  <div
                    className="v6-description"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeDescription(
                        String(order.description).replace(/^(<br\s*\/?\>)+/i, '')
                      ),
                    }}
                  />
                )}

                {/* 4-stat grid */}
                <div className="v6-stats-grid">
                  <div className="v6-stat-card">
                    <div className="v6-stat-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                      <BedDouble size={28} />
                    </div>
                    <span className="v6-stat-val">{order.bedrooms ?? '—'}</span>
                    <span className="v6-stat-label">Bedrooms</span>
                  </div>
                  <div className="v6-stat-card">
                    <div className="v6-stat-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                      <Bath size={28} />
                    </div>
                    <span className="v6-stat-val">{order.bathrooms ?? '—'}</span>
                    <span className="v6-stat-label">Bathrooms</span>
                  </div>
                  <div className="v6-stat-card">
                    <div className="v6-stat-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                      <Maximize size={28} />
                    </div>
                    <span className="v6-stat-val">{order.propertySize ?? '—'}</span>
                    <span className="v6-stat-label">Sq Ft</span>
                  </div>
                  <div className="v6-stat-card">
                    <div className="v6-stat-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                      <CalendarDays size={28} />
                    </div>
                    <span className="v6-stat-val">{order.yearBuilt ?? '—'}</span>
                    <span className="v6-stat-label">Year Built</span>
                  </div>
                </div>

                {/* MLS + Price info row */}
                <div className="v6-info-grid">
                  {order.mlsNumber && (
                    <div className="v6-info-item">
                      <Hash size={18} className="v6-info-icon" />
                      <div>
                        <div className="v6-info-label">MLS® Number</div>
                        <div className="v6-info-val">{order.mlsNumber}</div>
                      </div>
                    </div>
                  )}
                  {priceFormatted && (
                    <div className="v6-info-item">
                      <Tag size={18} className="v6-info-icon" />
                      <div>
                        <div className="v6-info-label">Price</div>
                        <div className="v6-info-val">{priceFormatted}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── FEATURES ────────────────────────────── */}
          {showFeatures && (
            <section id="features" className="v6-section">
              <div className="v6-section-label">
                <span>Key Features</span>
              </div>
              <h2 className="v6-section-h">Property Highlights</h2>
              <p className="v6-section-sub">
                Everything that makes this property stand out.
              </p>
              <div className="v6-features-grid">
                {features.map((feat, i) => (
                  <div key={i} className="v6-feature-item">
                    <div className="v6-feature-icon-wrap">
                      <Check size={16} />
                    </div>
                    <span className="v6-feature-text">{feat}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── DESCRIPTION (standalone) ─────────────── */}
          {showDescription && !showFeatures && (
            <section id="description" className="v6-section">
              <div className="v6-section-label">
                <span>About This Home</span>
              </div>
              <div
                className="v6-description"
                style={{ maxWidth: '800px', margin: '0 auto' }}
                dangerouslySetInnerHTML={{
                  __html: sanitizeDescription(
                    String(order.description).replace(/^(<br\s*\/?\>)+/i, '')
                  ),
                }}
              />
            </section>
          )}

          {/* ── PHOTO GALLERY ───────────────────────── */}
          {showPhotos && (
            <section id="photos" className="v6-section">
              <div className="v6-section-label">
                <span>Photo Gallery</span>
              </div>
              <h2 className="v6-section-h">Every Detail, Beautifully Captured</h2>
              <p className="v6-section-sub">
                Professional photography showcasing the finest features of this property.
              </p>

              <div className="v6-masonry">
                {photos.slice(0, 9).map((p: any, i: number) => (
                  <div key={p.id} className="v6-masonry-item">
                    <PhotoLightbox
                      src={p.urlMls || p.url}
                      alt={p.filename}
                      items={photoItems}
                      startIndex={i}
                      thumbClassName="w-full h-auto block"
                    />
                  </div>
                ))}
              </div>

              {photos.length > 0 && (
                <V4GalleryTrigger items={photoItems} count={photos.length} />
              )}
            </section>
          )}

          {/* ── FLOOR PLANS ────────────────────────── */}
          {showFloorPlans && (
            <section id="floorplans" className="v6-section">
              <div className="v6-section-label">
                <span>Floor Plans</span>
              </div>
              <h2 className="v6-section-h">Detailed Floor Plans</h2>
              <p className="v6-section-sub">
                Review the layout and dimensions of each level.
              </p>
              <div className="v6-fp-grid">
                {floorPlans.map((f: any, i: number) => (
                  <V6FloorPlanCard
                    key={f.id}
                    src={f.url}
                    alt={f.filename}
                    items={floorPlanItems}
                    startIndex={i}
                    label={
                      f.filename?.replace(/\.[^.]+$/, '') ||
                      `Floor Plan ${i + 1}`
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── VIDEO ──────────────────────────────── */}
          {showVideo && (
            <section id="video" className="v6-section">
              <div className="v6-section-label">
                <span>Property Video</span>
              </div>
              <h2 className="v6-section-h">Cinematic Property Tour</h2>
              <p className="v6-section-sub">
                Experience the flow and atmosphere of this home through our
                professionally produced video walkthrough.
              </p>
              <div className="v6-video-wrap">
                <div className="v6-video-embed">
                  <video controls>
                    <source src={order.videos[0].url} />
                  </video>
                </div>
              </div>
            </section>
          )}

          {/* ── VIRTUAL TOUR ───────────────────────── */}
          {showTours && (
            <section id="tours" className="v6-section">
              <div className="v6-section-label">
                <span>Virtual Tour</span>
              </div>
              <h2 className="v6-section-h">Explore in 3D</h2>
              <p className="v6-section-sub">
                Take an interactive tour and experience the property as if
                you were walking through it in person.
              </p>
              <div className="v6-tour-wrap">
                <div className="v6-tour-embed">
                  <iframe
                    src={iguide.embedUrl}
                    title={iguide.title || 'Virtual Tour'}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <div className="v6-tour-footer">
                  <div className="v6-tour-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <div>
                    <p className="v6-tour-title">3D Virtual Tour</p>
                    <p className="v6-tour-sub">Interactive floor plans &amp; measurements</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── MAP ────────────────────────────────── */}
          {showMap && (
            <section id="map" className="v6-section">
              <div className="v6-section-label">
                <span>Location</span>
              </div>
              <h2 className="v6-section-h">Prime Location</h2>
              <p className="v6-section-sub">
                Explore the neighbourhood and nearby amenities.
              </p>
              <div className="v6-map-wrap">
                <div className="v6-map-inner">
                  <MapWithMarker
                    lat={order.propertyLat}
                    lng={order.propertyLng}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ── CONTACT ────────────────────────────── */}
          <section id="contact" className="v6-section">
            <div className="v6-section-label">
              <span>Get In Touch</span>
            </div>
            <div className="v6-contact-grid">
              {/* Left: realtor info */}
              <div>
                <h2
                  className="v6-serif"
                  style={{
                    fontSize: 'clamp(1.6rem,3.5vw,2.2rem)',
                    fontWeight: 700, color: '#111827',
                    marginBottom: '16px', lineHeight: 1.2,
                  }}
                >
                  Interested in This Property?
                </h2>
                <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '28px', lineHeight: 1.7 }}>
                  Contact your agent today to schedule a private showing or
                  to learn more about this exceptional home.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                  {phoneTel && (
                    <div className="v6-contact-tile">
                      <div className="v6-contact-tile-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </div>
                      <div>
                        <div className="v6-contact-tile-label">Direct Line</div>
                        <a href={phoneTel}>{order.realtor.phone}</a>
                      </div>
                    </div>
                  )}
                  {order.realtor.email && (
                    <div className="v6-contact-tile">
                      <div className="v6-contact-tile-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <div>
                        <div className="v6-contact-tile-label">Email</div>
                        <a href={`mailto:${order.realtor.email}`}>{order.realtor.email}</a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Social links */}
                {hasSocial && (
                  <div className="v6-social-links">
                    {order.realtor.facebookUrl && (
                      <a href={order.realtor.facebookUrl} target="_blank" rel="noopener noreferrer" className="v6-social-btn" aria-label="Facebook">
                        <Facebook size={17} />
                      </a>
                    )}
                    {order.realtor.linkedinUrl && (
                      <a href={order.realtor.linkedinUrl} target="_blank" rel="noopener noreferrer" className="v6-social-btn" aria-label="LinkedIn">
                        <Linkedin size={17} />
                      </a>
                    )}
                    {order.realtor.instagramUrl && (
                      <a href={order.realtor.instagramUrl} target="_blank" rel="noopener noreferrer" className="v6-social-btn" aria-label="Instagram">
                        <Instagram size={17} />
                      </a>
                    )}
                    {order.realtor.youtubeUrl && (
                      <a href={order.realtor.youtubeUrl} target="_blank" rel="noopener noreferrer" className="v6-social-btn" aria-label="YouTube">
                        <Youtube size={17} />
                      </a>
                    )}
                    {order.realtor.twitterUrl && (
                      <a href={order.realtor.twitterUrl} target="_blank" rel="noopener noreferrer" className="v6-social-btn" aria-label="Twitter/X">
                        <XIcon width={17} height={17} />
                      </a>
                    )}
                    {order.realtor.tiktokUrl && (
                      <a href={order.realtor.tiktokUrl} target="_blank" rel="noopener noreferrer" className="v6-social-btn" aria-label="TikTok">
                        <TikTokIcon width={17} height={17} />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Right: contact form */}
              <div className="v6-form-wrap">
                <h3 className="v6-form-title">Send a Message</h3>
                <span className="v6-form-sub">
                  We&apos;ll get back to you within 24 hours.
                </span>
                <ContactForm orderId={order.id} />
              </div>
            </div>
          </section>

        </main>{/* end v6-main */}

        {/* ══ FOOTER ════════════════════════════════════════════ */}
        <footer className="v6-footer">
          <div className="v6-container">
            <div className="v6-footer-top">
              {/* CREA trademark logos */}
{/* eslint-disable-next-line @next/next/no-img-element */}
<img
  src="/images/crea-logos.png"
  alt="REALTOR and MLS trademarks"
  style={{ height: '32px', width: 'auto', objectFit: 'contain', opacity: 0.75 }}
/>
            </div>

            <div className="v6-footer-legal">
              <p>
                The trademarks REALTOR®, REALTORS®, and the REALTOR® logo are controlled by
                The Canadian Real Estate Association (CREA) and identify real estate professionals
                who are members of CREA.
              </p>
              <p>
                The trademarks MLS®, Multiple Listing Service® and the associated logos are owned
                by The Canadian Real Estate Association (CREA) and identify the quality of services
                provided by real estate professionals who are members of CREA. Used under license.
              </p>
            </div>

            <div className="v6-footer-bottom">
              <p>
                Powered by{' '}
                <a href="https://photos4realestate.ca/" target="_blank" rel="noopener noreferrer">
                  Photos 4 Real Estate
                </a>{' '}
                · © {new Date().getFullYear()} All Rights Reserved
              </p>
              <div style={{ display: 'flex', gap: '20px' }}>
                <a href="https://photos4realestate.ca/terms-and-conditions/" target="_blank" rel="noopener noreferrer">Terms</a>
                <span>·</span>
                <a href="https://photos4realestate.ca/privacy-policy/" target="_blank" rel="noopener noreferrer">Privacy</a>
              </div>
            </div>
          </div>
        </footer>

        {/* ══ MOBILE STICKY BAR (tablets + mobile) ════════════════ */}
        <V6MobileBar
          realtorName={realtorName}
          phone={order.realtor.phone}
          priceFormatted={priceFormatted}
        />

      </div>{/* end .v6 */}
    </>  );
}
