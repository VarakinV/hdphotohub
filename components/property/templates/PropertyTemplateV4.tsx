import { PhotoLightbox } from '@/components/delivery/PhotoLightbox';
import ContactForm from '@/components/property/ContactForm';
import HeroSlider from '@/components/property/HeroSlider';
import V4NavMenu from '@/components/property/templates/V4NavMenu';
import V4GalleryTrigger from '@/components/property/templates/V4GalleryTrigger';
import { sanitizeDescription } from '@/lib/sanitize';
import MapWithMarker from '@/components/property/MapWithMarker';
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react';
import { TikTokIcon } from '@/components/icons/TikTokIcon';
import { XIcon } from '@/components/icons/XIcon';

/* ─────────────────────────────────────────────────────────────────
   V4 SCOPED STYLES
   All class names are prefixed with "v4-" to avoid collisions.
   Fonts: Cormorant Garamond (serif) + Instrument Sans (sans-serif)
   Palette: --v4-cream / --v4-ink / --v4-gold / --v4-gold-light
───────────────────────────────────────────────────────────────── */
const V4_STYLES = `
  .v4-template {
    --v4-cream: #F5F0E8;
    --v4-ink: #1A1714;
    --v4-gold: #B8955A;
    --v4-gold-light: #D4AF7A;
    --v4-warm-gray: #8A8278;
    --v4-border: rgba(184,149,90,0.25);
    font-family: 'Instrument Sans', sans-serif;
    background: var(--v4-cream);
    color: var(--v4-ink);
    font-size: 15px;
    line-height: 1.7;
    overflow-x: hidden;
  }

  /* ── Layout helpers ─────────────────────────────── */
  .v4-container { max-width: 1280px; margin: 0 auto; padding: 0 48px; }
  .v4-serif { font-family: 'Cormorant Garamond', serif; }
  .v4-section { padding: 100px 0; }
  .v4-section-border { border-bottom: 1px solid var(--v4-border); }

  /* ── Section label ──────────────────────────────── */
  .v4-section-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--v4-gold);
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 22px;
  }
  .v4-section-label::after {
    content: '';
    display: block;
    width: 40px; height: 1px;
    background: var(--v4-gold);
    opacity: 0.5;
  }

  /* ── Hero content ───────────────────────────────── */
  .v4-hero-content {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    z-index: 10;
    padding: 0 48px 72px;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: flex-end;
    gap: 60px;
    pointer-events: none;
  }
  .v4-hero-content > * { pointer-events: auto; }
  .v4-hero-address {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(36px, 5.5vw, 68px);
    font-weight: 300;
    color: var(--v4-cream);
    line-height: 1.08;
    letter-spacing: -0.01em;
    margin: 0;
  }
  .v4-hero-city {
    font-size: clamp(14px, 1.6vw, 18px);
    font-weight: 400;
    letter-spacing: 0.04em;
    color: var(--v4-gold-light);
    display: block;
    margin-top: 6px;
    font-family: 'Instrument Sans', sans-serif;
  }
  .v4-hero-price-tag { color: var(--v4-cream); text-align: right; }
  .v4-hero-price-label {
    font-size: 10px; letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(245,240,232,0.5);
    margin-bottom: 6px;
  }
  .v4-hero-price-number {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(24px, 2.8vw, 38px);
    font-weight: 300;
    color: var(--v4-gold-light);
    letter-spacing: 0.02em;
  }
  .v4-hero-realtor-box {
    display: flex; align-items: center; gap: 14px;
    padding: 13px 16px;
    background: rgba(245,240,232,0.08);
    border: 1px solid rgba(245,240,232,0.18);
    backdrop-filter: blur(10px);
    margin-top: 16px;
    flex-wrap: wrap;
  }
  .v4-hero-realtor-photo {
    width: 48px; height: 48px;
    border-radius: 50%; object-fit: cover;
    flex-shrink: 0;
    border: 2px solid rgba(184,149,90,0.5);
  }
  .v4-hero-realtor-info { color: var(--v4-cream); flex: 1; min-width: 0; }
  .v4-hero-realtor-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px; font-weight: 400;
    display: block; white-space: nowrap;
  }
  .v4-hero-realtor-meta {
    font-size: 10px; letter-spacing: 0.08em;
    color: rgba(245,240,232,0.55);
    display: block; white-space: nowrap;
  }
  .v4-hero-divider {
    width: 1px; height: 32px;
    background: rgba(245,240,232,0.18);
    flex-shrink: 0;
  }
  .v4-hero-agency-logo {
    height: 24px; width: auto; max-width: 88px;
    object-fit: contain; flex-shrink: 0;
  }
  .v4-hero-phone {
    display: flex; align-items: center; gap: 6px;
    color: var(--v4-gold-light); font-size: 12px;
    text-decoration: none; flex-shrink: 0; white-space: nowrap;
  }

  /* Scroll hint */
  .v4-scroll-hint {
    position: absolute; bottom: 28px; right: 48px; z-index: 10;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    color: rgba(245,240,232,0.4);
    font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
    animation: v4ScrollBob 2.5s ease-in-out infinite;
  }
  .v4-scroll-hint-line {
    width: 1px; height: 30px;
    background: linear-gradient(to bottom, rgba(245,240,232,0.4), transparent);
  }
  @keyframes v4ScrollBob {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(5px); }
  }

  /* ── Stats bar (property details) ──────────────── */
  .v4-stats-bar {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    border: 1px solid var(--v4-border);
    background: white;
  }
  .v4-stat-cell {
    padding: 26px 16px; text-align: center;
    border-right: 1px solid var(--v4-border);
  }
  .v4-stat-cell:last-child { border-right: none; }
  .v4-stat-label {
    font-size: 9px; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--v4-warm-gray);
    margin-bottom: 8px; display: block;
  }
  .v4-stat-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 26px; font-weight: 400;
    color: var(--v4-ink); display: block; line-height: 1;
  }
  .v4-stat-price { background: var(--v4-ink); }
  .v4-stat-price .v4-stat-label { color: rgba(245,240,232,0.45); }
  .v4-stat-price .v4-stat-value { color: var(--v4-gold-light); font-size: 22px; }

  /* ── Features (dark) ────────────────────────────── */
  .v4-features-section { background: var(--v4-ink); color: var(--v4-cream); padding: 100px 0; }
  .v4-features-inner {
    max-width: 1280px; margin: 0 auto; padding: 0 48px;
    display: grid; grid-template-columns: 1fr 2fr;
    gap: 80px; align-items: start;
  }
  .v4-features-headline {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(32px, 4vw, 50px); font-weight: 300;
    line-height: 1.1; position: sticky; top: 100px; margin: 0;
  }
  .v4-features-headline em { font-style: italic; color: var(--v4-gold-light); }
  .v4-feature-list {
    list-style: none; padding: 0; margin: 0;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 12px 28px;
  }
  .v4-feature-item {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 14px; color: rgba(245,240,232,0.8);
    line-height: 1.5; padding-bottom: 12px;
    border-bottom: 1px solid rgba(184,149,90,0.12);
  }
  .v4-feature-icon {
    width: 16px; height: 16px;
    border: 1px solid var(--v4-gold);
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    margin-top: 2px;
  }

  /* ── Description ────────────────────────────────── */
  .v4-description-inner {
    display: grid; grid-template-columns: 1fr 2fr;
    gap: 80px; align-items: start;
  }
  .v4-description-heading {
    font-family: 'Cormorant Garamond', serif;
    font-size: 42px; font-weight: 300;
    line-height: 1.1; position: sticky; top: 100px; margin: 0;
  }
  .v4-description-heading em { font-style: italic; color: var(--v4-gold); }
  .v4-description-body { font-size: 15px; line-height: 1.9; color: var(--v4-warm-gray); }
  .v4-description-body p { margin-bottom: 20px; }
  .v4-description-body p:first-of-type {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px; font-weight: 300; line-height: 1.65;
    color: var(--v4-ink);
  }

  /* ── Gallery ────────────────────────────────────── */
  .v4-gallery-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-auto-rows: 220px;
    gap: 8px;
  }
  .v4-gallery-item { overflow: hidden; cursor: pointer; background: #DDD8CE; }
  .v4-gallery-item img,
  .v4-gallery-item > span,
  .v4-gallery-item > div { width: 100% !important; height: 100% !important; display: block; }

  .v4-view-all-wrap {
    margin-top: 28px;
    display: flex;
    justify-content: center;
  }
  .v4-view-all-btn {
    display: inline-flex;
    align-items: center;
    padding: 13px 30px;
    border: 1px solid var(--v4-ink);
    background: transparent;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--v4-ink);
    cursor: pointer;
    transition: all 0.2s;
    line-height: 1;
  }
  .v4-view-all-btn:hover {
    background: var(--v4-ink);
    color: var(--v4-cream);
  }

  /* ── Floor plans ────────────────────────────────── */
  .v4-fp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
  .v4-fp-card {
    background: white; border: 1px solid var(--v4-border);
    overflow: hidden; transition: border-color 0.2s;
  }
  .v4-fp-card:hover { border-color: var(--v4-gold); }
  .v4-fp-image { aspect-ratio: 4/3; background: #EDE8DF; overflow: hidden; }
  .v4-fp-footer {
    padding: 14px 18px;
    display: flex; justify-content: space-between; align-items: center;
    border-top: 1px solid var(--v4-border);
  }
  .v4-fp-name { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 400; }
  .v4-fp-action { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--v4-gold); }

  /* ── Video (dark) ───────────────────────────────── */
  .v4-video-section { background: var(--v4-ink); color: var(--v4-cream); padding: 100px 0; }
  .v4-video-inner { max-width: 920px; margin: 0 auto; padding: 0 48px; }
  .v4-video-header { text-align: center; margin-bottom: 36px; }
  .v4-video-heading {
    font-family: 'Cormorant Garamond', serif;
    font-size: 42px; font-weight: 300; margin: 10px 0 0;
  }
  .v4-video-heading em { font-style: italic; color: var(--v4-gold-light); }
  .v4-video-embed {
    position: relative; padding-bottom: 56.25%;
    height: 0; overflow: hidden;
    background: #2C2420;
    border: 1px solid rgba(184,149,90,0.2);
  }
  .v4-video-embed video,
  .v4-video-embed iframe {
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%; border: none; object-fit: contain;
  }

  /* ── Virtual Tour ───────────────────────────────── */
  .v4-tour-inner {
    display: grid; grid-template-columns: 1fr 2fr;
    gap: 80px; align-items: center;
  }
  .v4-tour-heading {
    font-family: 'Cormorant Garamond', serif;
    font-size: 42px; font-weight: 300; line-height: 1.1;
    margin: 0 0 14px;
  }
  .v4-tour-heading em { font-style: italic; color: var(--v4-gold); }
  .v4-tour-embed {
    position: relative; padding-bottom: 56.25%;
    height: 0; overflow: hidden;
    background: #EDE8DF;
    border: 1px solid var(--v4-border);
  }
  .v4-tour-embed iframe {
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%; border: none;
  }

  /* ── Contact ────────────────────────────────────── */
  .v4-contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
  .v4-realtor-card { background: var(--v4-ink); color: var(--v4-cream); padding: 44px; }
  .v4-realtor-photo {
    width: 88px; height: 88px;
    border-radius: 50%; object-fit: cover;
    margin-bottom: 20px;
    border: 3px solid rgba(184,149,90,0.3);
    display: block;
  }
  .v4-realtor-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px; font-weight: 300; margin: 0 0 4px;
  }
  .v4-realtor-title {
    font-size: 10px; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--v4-gold-light);
    display: block; margin-bottom: 18px;
  }
  .v4-realtor-agency-row {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 24px; padding-bottom: 24px;
    border-bottom: 1px solid rgba(184,149,90,0.2);
  }
  .v4-agency-logo { height: 28px; width: auto; max-width: 120px; object-fit: contain; }
  .v4-agency-name { font-size: 13px; color: rgba(245,240,232,0.5); }
  .v4-realtor-contacts { display: flex; flex-direction: column; gap: 12px; }
  .v4-contact-item {
    display: flex; align-items: center; gap: 12px;
    font-size: 14px; color: rgba(245,240,232,0.8); text-decoration: none;
  }
  .v4-contact-icon {
    width: 34px; height: 34px;
    border: 1px solid rgba(184,149,90,0.25);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; color: var(--v4-gold);
  }
  .v4-social-links { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
  .v4-social-link {
    width: 34px; height: 34px;
    border: 1px solid rgba(184,149,90,0.25);
    display: flex; align-items: center; justify-content: center;
    color: var(--v4-gold-light); text-decoration: none;
    transition: background 0.2s;
  }
  .v4-social-link:hover { background: rgba(184,149,90,0.15); }

  /* Contact form overrides — match V4 aesthetic */
  .v4-contact-form h3 { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300; margin: 0 0 6px; color: var(--v4-ink); }
  .v4-contact-form p { font-size: 13px; color: var(--v4-warm-gray); margin-bottom: 24px; }
  .v4-contact-form input,
  .v4-contact-form textarea {
    border-radius: 0 !important;
    border-color: var(--v4-border) !important;
    background: white !important;
    font-family: 'Instrument Sans', sans-serif !important;
    font-size: 14px !important;
    color: var(--v4-ink) !important;
    outline: none !important;
    transition: border-color 0.2s !important;
  }
  .v4-contact-form input:focus,
  .v4-contact-form textarea:focus {
    border-color: var(--v4-gold) !important;
    box-shadow: none !important;
    ring: none !important;
  }
  .v4-contact-form button[type="submit"] {
    background: var(--v4-gold) !important;
    color: var(--v4-cream) !important;
    border-radius: 0 !important;
    font-family: 'Instrument Sans', sans-serif !important;
    font-size: 11px !important;
    letter-spacing: 0.18em !important;
    text-transform: uppercase !important;
    padding: 14px 28px !important;
    transition: background 0.2s !important;
    border: none !important;
  }
  .v4-contact-form button[type="submit"]:hover:not(:disabled) { background: #A0804A !important; }
  .v4-contact-form button[type="submit"]:disabled { opacity: 0.6 !important; }

  /* ── Footer ─────────────────────────────────────── */
  .v4-footer { background: #0F0D0B; color: var(--v4-cream); padding: 44px 0 24px; }
  .v4-footer-inner { display: flex; flex-direction: column; align-items: center; gap: 20px; text-align: center; }
  .v4-footer-legal { font-size: 10.5px; color: rgba(245,240,232,0.3); line-height: 1.8; max-width: 720px; }
  .v4-footer-bottom {
    font-size: 11px; color: rgba(245,240,232,0.25);
    display: flex; gap: 14px; flex-wrap: wrap; justify-content: center;
  }
  .v4-footer-bottom a { color: rgba(245,240,232,0.35); text-decoration: none; }
  .v4-footer-bottom a:hover { color: var(--v4-gold); }

  /* ── Responsive ─────────────────────────────────── */
  @media (max-width: 900px) {
    .v4-container { padding: 0 20px; }
    .v4-hero-content { grid-template-columns: 1fr; gap: 20px; padding: 0 20px 56px; }
    .v4-hero-price-tag { text-align: left; }
    .v4-stats-bar { grid-template-columns: repeat(3, 1fr); }
    .v4-stat-cell { border-bottom: 1px solid var(--v4-border); }
    .v4-features-inner,
    .v4-description-inner,
    .v4-tour-inner,
    .v4-contact-grid { grid-template-columns: 1fr; gap: 36px; }
    .v4-features-headline,
    .v4-description-heading { position: static; }
    .v4-feature-list { grid-template-columns: 1fr; }
    .v4-fp-grid { grid-template-columns: 1fr; }
    .v4-gallery-grid { grid-template-columns: repeat(6, 1fr); grid-auto-rows: 200px; }
    .v4-gallery-span-7,
    .v4-gallery-span-5,
    .v4-gallery-span-4 { grid-column: span 6 !important; }
    .v4-scroll-hint { display: none; }
    .v4-section { padding: 60px 0; }
    .v4-features-section,
    .v4-video-section { padding: 60px 0; }
    .v4-features-inner { padding: 0 20px; }
    .v4-video-inner { padding: 0 20px; }
    .v4-realtor-card { padding: 28px 20px; }
    .v4-contact-grid { gap: 40px; }
  }

  @media (max-width: 600px) {
    .v4-stats-bar { grid-template-columns: repeat(2, 1fr); }
    .v4-gallery-grid { grid-template-columns: repeat(4, 1fr); grid-auto-rows: 160px; }
    .v4-gallery-span-7,
    .v4-gallery-span-5,
    .v4-gallery-span-4 { grid-column: span 4 !important; }
  }
`;

/* Gallery span pattern: 7, 5, 4, 4, 4, then repeating */
const GALLERY_SPANS = [7, 5, 4, 4, 4];

export default function PropertyTemplateV4({
  order,
  baseUrl,
}: {
  order: any;
  baseUrl: string;
}) {
  const realtorName = `${order.realtor.firstName} ${order.realtor.lastName}`;
  const fullUrl = `${baseUrl}/property/${order.id}/v4`;

  /* ── Address ─────────────────────────────────── */
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
      ? formatted
          .split(',')
          .slice(1, 3)
          .map((s: string) => s.trim())
          .filter(Boolean)
          .join(', ')
      : '');

  const phoneTel = order.realtor.phone
    ? `tel:${String(order.realtor.phone).replace(/[^+\d]/g, '')}`
    : undefined;

  const priceFormatted = order.listPrice
    ? `$${Number(order.listPrice).toLocaleString()}`
    : undefined;

  /* ── Photos ──────────────────────────────────── */
  const photos = order.photos || [];
  const photoItems = photos.map((p: any) => ({
    src: p.urlMls || p.url,
    alt: p.filename,
  }));
  /* show up to 7 photos in the editorial grid */
  const displayPhotos = photos.slice(0, 7);

  /* ── Floor plans ─────────────────────────────── */
  const floorPlans = order.floorPlans || [];
  const floorPlanItems = floorPlans.map((fp: any) => ({
    src: fp.url,
    alt: fp.filename,
  }));

  /* ── Embeds (virtual tour) ───────────────────── */
  const iguide =
    (order.embeds || []).find((e: any) =>
      /iguide|matterport|tour/i.test(e.embedUrl)
    ) || (order.embeds || [])[0];

  /* ── Features list ───────────────────────────── */
  const features: string[] = order.featuresText
    ? String(order.featuresText)
        .split(/\r?\n/)
        .map((ln: string) => ln.trim())
        .filter(Boolean)
    : [];

  /* ── Section visibility ──────────────────────── */
  const showFeatures = features.length > 0;
  const showDescription = Boolean(order.description);
  const showPhotos = photos.length > 0;
  const showFloorPlans = floorPlans.length > 0;
  const showVideo = (order.videos || []).length > 0;
  const showTours = Boolean(iguide);
  const showMap = order.propertyLat != null && order.propertyLng != null;

  return (
    <>
      {/* ── Google Fonts ─────────────────────────── */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Instrument+Sans:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      {/* ── Scoped styles ────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: V4_STYLES }} />

      <div className="v4-template">

        {/* ════════════════════════════════════════
            NAV
        ════════════════════════════════════════ */}
        <V4NavMenu
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

        {/* ════════════════════════════════════════
            HERO — slideshow + address + realtor box
        ════════════════════════════════════════ */}
        <section
          id="hero"
          style={{ position: 'relative', height: '100vh', minHeight: '700px', overflow: 'hidden' }}
        >
          {/* Slideshow fills the entire section */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <HeroSlider
              images={photos.map((p: any) => p.urlMls || p.url)}
              url={fullUrl}
              title={street}
              className="h-full"
            />
          </div>

          {/* Extra gradient scrim for the V4 warm-dark bottom sweep */}
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
              background:
                'linear-gradient(to bottom, rgba(15,13,11,0.1) 0%, rgba(15,13,11,0) 30%, rgba(15,13,11,0.05) 55%, rgba(15,13,11,0.55) 100%)',
            }}
          />

          {/* Address + price + realtor box */}
          <div className="v4-hero-content">
            <div>
              <h1 className="v4-hero-address">
                {street}
                {cityLine && (
                  <span className="v4-hero-city">{cityLine}</span>
                )}
              </h1>

              {/* Realtor contact box */}
              <div className="v4-hero-realtor-box">
                {order.realtor.headshot && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="v4-hero-realtor-photo"
                    src={order.realtor.headshot}
                    alt={realtorName}
                  />
                )}
                <div className="v4-hero-realtor-info">
                  <span className="v4-hero-realtor-name">{realtorName}</span>
                </div>

                {phoneTel && (
                  <>
                    <div className="v4-hero-divider" />
                    <a href={phoneTel} className="v4-hero-phone">
                      <svg
                        viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" width="13" height="13"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      {order.realtor.phone}
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Price */}
            {priceFormatted && (
              <div className="v4-hero-price-tag">
                <div className="v4-hero-price-label">Offered At</div>
                <div className="v4-hero-price-number">{priceFormatted}</div>
              </div>
            )}
          </div>

          {/* Scroll hint */}
          <div className="v4-scroll-hint">
            <div className="v4-scroll-hint-line" />
            <span>Scroll</span>
          </div>
        </section>

        {/* ════════════════════════════════════════
            PROPERTY DETAILS — stats bar
        ════════════════════════════════════════ */}
        <section
          id="details"
          className="v4-section v4-section-border"
          style={{ paddingTop: '100px', paddingBottom: '60px' }}
        >
          <div className="v4-container">
            <div className="v4-section-label">Property Details</div>
            <div className="v4-stats-bar">
              <div className="v4-stat-cell">
                <span className="v4-stat-label">Bedrooms</span>
                <span className="v4-stat-value">{order.bedrooms ?? '—'}</span>
              </div>
              <div className="v4-stat-cell">
                <span className="v4-stat-label">Bathrooms</span>
                <span className="v4-stat-value">{order.bathrooms ?? '—'}</span>
              </div>
              <div className="v4-stat-cell">
                <span className="v4-stat-label">Square Feet</span>
                <span className="v4-stat-value">{order.propertySize ?? '—'}</span>
              </div>
              <div className="v4-stat-cell">
                <span className="v4-stat-label">Year Built</span>
                <span className="v4-stat-value">{order.yearBuilt ?? '—'}</span>
              </div>
              <div className="v4-stat-cell">
                <span className="v4-stat-label">MLS® Number</span>
                <span className="v4-stat-value" style={{ fontSize: '18px' }}>
                  {order.mlsNumber || '—'}
                </span>
              </div>
              <div className="v4-stat-cell v4-stat-price">
                <span className="v4-stat-label">Price</span>
                <span className="v4-stat-value">{priceFormatted || '—'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FEATURES — dark section with checklist
        ════════════════════════════════════════ */}
        {showFeatures && (
          <section id="features" className="v4-features-section">
            <div className="v4-features-inner">
              <div>
                <div
                  className="v4-section-label"
                  style={{ color: 'var(--v4-gold-light)' }}
                >
                  <span>Property Features</span>
                </div>
                <h2 className="v4-features-headline">
                  Refined<br />in Every<br /><em>Detail</em>
                </h2>
              </div>

              <ul className="v4-feature-list">
                {features.map((feat, i) => (
                  <li key={i} className="v4-feature-item">
                    <span className="v4-feature-icon">
                      <svg
                        viewBox="0 0 12 10" fill="none"
                        stroke="currentColor" strokeWidth="2"
                        width="10" height="10"
                        style={{ color: 'var(--v4-gold)' }}
                      >
                        <polyline points="1,5 4.5,8.5 11,1" />
                      </svg>
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════
            DESCRIPTION — two-column layout
        ════════════════════════════════════════ */}
        {showDescription && (
          <section id="description" className="v4-section v4-section-border">
            <div className="v4-container">
              <div className="v4-description-inner">
                <div>
                  <div className="v4-section-label">Property Description</div>
                  <h2 className="v4-description-heading">
                    The<br />Full<br /><em>Story</em>
                  </h2>
                </div>
                <div
                  className="v4-description-body"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeDescription(
                      String(order.description).replace(/^(<br\s*\/?\>)+/i, '')
                    ),
                  }}
                />
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════
            PHOTO GALLERY — editorial 12-column grid
        ════════════════════════════════════════ */}
        {showPhotos && (
          <section
            id="gallery"
            className="v4-section"
            style={{ background: 'white', padding: '100px 0' }}
          >
            <div className="v4-container">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginBottom: '36px',
                }}
              >
                <h2
                  className="v4-serif"
                  style={{ fontSize: '44px', fontWeight: 300, margin: 0 }}
                >
                  Photo Gallery
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--v4-warm-gray)',
                  }}
                >
                  {photos.length} Photos
                </span>
              </div>

              <div className="v4-gallery-grid">
                {displayPhotos.map((p: any, i: number) => {
                  const span = GALLERY_SPANS[i % GALLERY_SPANS.length];
                  return (
                    <div
                      key={p.id}
                      className={`v4-gallery-item v4-gallery-span-${span}`}
                      style={{ gridColumn: `span ${span}` }}
                    >
                      <PhotoLightbox
                        src={p.urlMls || p.url}
                        alt={p.filename}
                        items={photoItems}
                        startIndex={i}
                        thumbClassName="w-full h-full object-cover cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>

              {/* "View All X Photos" button */}
              <V4GalleryTrigger items={photoItems} count={photos.length} />
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════
            FLOOR PLANS — card grid
        ════════════════════════════════════════ */}
        {showFloorPlans && (
          <section id="floorplans" className="v4-section v4-section-border">
            <div className="v4-container">
              <div className="v4-section-label">Floor Plans</div>
              <h2
                className="v4-serif"
                style={{ fontSize: '44px', fontWeight: 300, marginBottom: '32px' }}
              >
                Layout &amp;{' '}
                <em style={{ fontStyle: 'italic', color: 'var(--v4-gold)' }}>
                  Dimensions
                </em>
              </h2>

              <div className="v4-fp-grid">
                {floorPlans.map((f: any, i: number) => (
                  <div key={f.id} className="v4-fp-card">
                    <div className="v4-fp-image">
                      <PhotoLightbox
                        src={f.url}
                        alt={f.filename}
                        items={floorPlanItems}
                        startIndex={i}
                        thumbClassName="w-full h-full object-contain p-4 bg-white cursor-pointer"
                      />
                    </div>
                    <div className="v4-fp-footer">
                      <span className="v4-fp-name">
                        {f.filename?.replace(/\.[^.]+$/, '') ||
                          `Floor Plan ${i + 1}`}
                      </span>
                      <span className="v4-fp-action">View Full Size →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════
            VIDEO TOUR — dark background
        ════════════════════════════════════════ */}
        {showVideo && (
          <section id="video" className="v4-video-section">
            <div className="v4-video-inner">
              <div className="v4-video-header">
                <div
                  className="v4-section-label"
                  style={{
                    color: 'var(--v4-gold-light)',
                    justifyContent: 'center',
                  }}
                >
                  <span>Property Video</span>
                </div>
                <h2 className="v4-video-heading">
                  Watch the <em>Tour</em>
                </h2>
              </div>
              <div className="v4-video-embed">
                <video controls>
                  <source src={order.videos[0].url} />
                </video>
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════
            VIRTUAL TOUR — side description + embed
        ════════════════════════════════════════ */}
        {showTours && (
          <section
            id="tour"
            className="v4-section"
            style={{ background: 'white' }}
          >
            <div className="v4-container">
              <div className="v4-tour-inner">
                <div>
                  <div className="v4-section-label">Immersive Experience</div>
                  <h2 className="v4-tour-heading">
                    360°<br /><em>Virtual</em><br />Tour
                  </h2>
                  <p
                    style={{
                      color: 'var(--v4-warm-gray)',
                      lineHeight: 1.8,
                      marginBottom: '24px',
                      fontSize: '14px',
                    }}
                  >
                    Explore every room at your own pace with our fully
                    interactive virtual tour. Measure spaces, view the floor
                    plan in 3D, and experience the home as if you were there.
                  </p>
                </div>
                <div className="v4-tour-embed">
                  <iframe
                    src={iguide.embedUrl}
                    title={iguide.title || 'Virtual Tour'}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════
            CONTACT — realtor dark card + form
        ════════════════════════════════════════ */}
        <section id="contact" className="v4-section v4-section-border">
          <div className="v4-container">
            <div className="v4-section-label">Presented By</div>
            <div className="v4-contact-grid">

              {/* Realtor card */}
              <div className="v4-realtor-card">
                {order.realtor.headshot && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="v4-realtor-photo"
                    src={order.realtor.headshot}
                    alt={realtorName}
                  />
                )}
                <h3 className="v4-realtor-name v4-serif">{realtorName}</h3>

                {(order.realtor.companyLogo || order.realtor.companyName) && (
                  <div className="v4-realtor-agency-row">
                    {order.realtor.companyLogo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="v4-agency-logo"
                        src={order.realtor.companyLogo}
                        alt={order.realtor.companyName || 'Agency'}
                      />
                    )}
                    {order.realtor.companyName && (
                      <span className="v4-agency-name">
                        {order.realtor.companyName}
                      </span>
                    )}
                  </div>
                )}

                <div className="v4-realtor-contacts">
                  {phoneTel && (
                    <a href={phoneTel} className="v4-contact-item">
                      <span className="v4-contact-icon">
                        <svg
                          viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2"
                          width="15" height="15"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </span>
                      {order.realtor.phone}
                    </a>
                  )}
                  {order.realtor.email && (
                    <a
                      href={`mailto:${order.realtor.email}`}
                      className="v4-contact-item"
                    >
                      <span className="v4-contact-icon">
                        <svg
                          viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2"
                          width="15" height="15"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </span>
                      {order.realtor.email}
                    </a>
                  )}
                </div>

                {/* Social links */}
                {(order.realtor.facebookUrl ||
                  order.realtor.linkedinUrl ||
                  order.realtor.instagramUrl ||
                  order.realtor.youtubeUrl ||
                  order.realtor.twitterUrl ||
                  order.realtor.tiktokUrl) && (
                  <div className="v4-social-links">
                    {order.realtor.facebookUrl && (
                      <a
                        href={order.realtor.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="v4-social-link"
                        aria-label="Facebook"
                      >
                        <Facebook size={14} />
                      </a>
                    )}
                    {order.realtor.linkedinUrl && (
                      <a
                        href={order.realtor.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="v4-social-link"
                        aria-label="LinkedIn"
                      >
                        <Linkedin size={14} />
                      </a>
                    )}
                    {order.realtor.instagramUrl && (
                      <a
                        href={order.realtor.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="v4-social-link"
                        aria-label="Instagram"
                      >
                        <Instagram size={14} />
                      </a>
                    )}
                    {order.realtor.youtubeUrl && (
                      <a
                        href={order.realtor.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="v4-social-link"
                        aria-label="YouTube"
                      >
                        <Youtube size={14} />
                      </a>
                    )}
                    {order.realtor.twitterUrl && (
                      <a
                        href={order.realtor.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="v4-social-link"
                        aria-label="Twitter/X"
                      >
                        <XIcon width={14} height={14} />
                      </a>
                    )}
                    {order.realtor.tiktokUrl && (
                      <a
                        href={order.realtor.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="v4-social-link"
                        aria-label="TikTok"
                      >
                        <TikTokIcon className="w-[14px] h-[14px]" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Contact form */}
              <div className="v4-contact-form">
                <h3>Get in Touch</h3>
                <p>
                  Questions about this property? Ready to schedule a showing?
                  We&apos;d love to hear from you.
                </p>
                <ContactForm orderId={order.id} />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            MAP
        ════════════════════════════════════════ */}
        {showMap && (
          <section
            id="map"
            style={{ height: '440px', position: 'relative', overflow: 'hidden' }}
          >
            <MapWithMarker
              lat={order.propertyLat}
              lng={order.propertyLng}
            />
          </section>
        )}

        {/* ════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════ */}
        <footer className="v4-footer">
          <div className="v4-footer-inner v4-container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/crea-logos.png"
              alt="REALTOR and MLS trademarks"
              style={{
                height: '28px',
                width: 'auto',
                objectFit: 'contain',
                opacity: 0.65,
              }}
            />
            <p className="v4-footer-legal">
              The trademarks REALTOR®, REALTORS®, and the REALTOR® logo are
              controlled by The Canadian Real Estate Association (CREA) and
              identify real estate professionals who are members of CREA. The
              trademarks MLS®, Multiple Listing Service® and the associated
              logos are owned by The Canadian Real Estate Association (CREA)
              and identify the quality of services provided by real estate
              professionals who are members of CREA. Used under license.
            </p>
            <div className="v4-footer-bottom">
              <span>
                Powered by{' '}
                <a
                  href="https://photos4realestate.ca/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Photos 4 Real Estate
                </a>
              </span>
              <span>·</span>
              <span>© {new Date().getFullYear()} All Rights Reserved</span>
              <span>·</span>
              <a
                href="https://photos4realestate.ca/terms-and-conditions/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms
              </a>
              <span>·</span>
              <a
                href="https://photos4realestate.ca/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
