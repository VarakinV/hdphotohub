import { PhotoLightbox } from '@/components/delivery/PhotoLightbox';
import ContactForm from '@/components/property/ContactForm';
import HeroSlider from '@/components/property/HeroSlider';
import V5NavMenu from '@/components/property/templates/V5NavMenu';
import V5FloorPlanCard from '@/components/property/templates/V5FloorPlanCard';
import V4GalleryTrigger from '@/components/property/templates/V4GalleryTrigger';
import { sanitizeDescription } from '@/lib/sanitize';
import MapWithMarker from '@/components/property/MapWithMarker';
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react';
import { XIcon } from '@/components/icons/XIcon';
import { TikTokIcon } from '@/components/icons/TikTokIcon';

/* ─────────────────────────────────────────────────────────────────
   V5 SCOPED STYLES
   Palette: Deep Slate (#0F172A) · Bronze (#B48E5A) · White/Light Gray
   Fonts:   Playfair Display (headings) · Inter (body)
   Classes: all prefixed "v5-" to avoid collisions
───────────────────────────────────────────────────────────────── */
const V5_STYLES = `
  /* ── Variables & base ───────────────────────────── */
  .v5 {
    --v5-primary:      #0F172A;
    --v5-secondary:    #334155;
    --v5-accent:       #B48E5A;
    --v5-accent-hover: #9A7748;
    --v5-bg:           #FFFFFF;
    --v5-bg-alt:       #F8FAFC;
    --v5-text:         #1E293B;
    --v5-text-light:   #64748B;
    --v5-border:       #E2E8F0;
    --v5-radius:       8px;
    --v5-shadow-md:    0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
    --v5-shadow-lg:    0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
    --v5-shadow-xl:    0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
    font-family: 'Inter', sans-serif;
    color: var(--v5-text);
    background: var(--v5-bg);
    -webkit-font-smoothing: antialiased;
    line-height: 1.6;
    overflow-x: hidden;
  }

  /* ── Layout helpers ─────────────────────────────── */
  .v5-container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
  .v5-section { padding: 80px 0; }
  .v5-section[id] { scroll-margin-top: 80px; }
  .v5-serif { font-family: 'Playfair Display', serif; }
  .v5-section-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.8rem, 4vw, 2.4rem);
    color: var(--v5-primary);
    margin-bottom: 8px;
    text-align: center;
    line-height: 1.2;
  }
  .v5-section-subtitle {
    color: var(--v5-text-light);
    text-align: center;
    font-size: 1rem;
    margin-bottom: 48px;
  }
  .v5-badge {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--v5-accent);
    background: rgba(180,142,90,0.08);
    border: 1px solid rgba(180,142,90,0.2);
    padding: 4px 10px;
    border-radius: 4px;
    margin-bottom: 12px;
    display: block;
  }

  /* ── Hero ───────────────────────────────────────── */
  .v5-hero {
    position: relative;
    height: 85vh;
    min-height: 600px;
    overflow: hidden;
    margin-top: 70px;
    display: flex;
    align-items: flex-end;
    padding-bottom: 60px;
  }
  .v5-hero-gradient {
    position: absolute; inset: 0; z-index: 2; pointer-events: none;
    background: linear-gradient(
      to top,
      rgba(15,23,42,0.82) 0%,
      rgba(15,23,42,0.18) 50%,
      rgba(15,23,42,0.35) 100%
    );
  }
  .v5-hero-body {
    position: relative; z-index: 3; width: 100%;
    pointer-events: none;
  }
  .v5-hero-body > * { pointer-events: auto; }
  .v5-hero-inner {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 30px;
    flex-wrap: wrap;
  }
  .v5-hero-text { color: white; max-width: 580px; }
  .v5-hero-price {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 5vw, 3.4rem);
    font-weight: 700;
    color: var(--v5-accent);
    margin-bottom: 10px;
    line-height: 1.1;
  }
  .v5-hero-address {
    font-size: 1.2rem; font-weight: 300;
    margin: 0 0 6px; color: white; line-height: 1.3;
  }
  .v5-hero-city { font-size: 0.95rem; opacity: 0.75; margin: 0; }

  /* Realtor card in hero */
  .v5-hero-card {
    background: white;
    padding: 24px;
    border-radius: var(--v5-radius);
    box-shadow: var(--v5-shadow-xl);
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 290px;
    max-width: 360px;
  }
  .v5-hero-card-photo {
    width: 64px; height: 64px;
    border-radius: 50%; object-fit: cover;
    border: 3px solid var(--v5-bg-alt);
    flex-shrink: 0;
  }
  .v5-hero-card-info { flex: 1; min-width: 0; }
  .v5-hero-card-name {
    font-size: 1rem; font-weight: 600; color: var(--v5-primary);
    margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .v5-hero-card-company {
    font-size: 0.8rem; color: var(--v5-text-light);
    margin: 0 0 8px; display: block;
  }
  .v5-hero-card-logo {
    height: 18px; width: auto; object-fit: contain;
    display: block; margin-bottom: 10px;
  }
  .v5-hero-card-phone {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.875rem; font-weight: 600;
    color: var(--v5-accent); text-decoration: none;
  }
  .v5-hero-card-phone:hover { color: var(--v5-accent-hover); }

  /* ── Details stats bar ──────────────────────────── */
  .v5-details-wrap {
    position: relative; z-index: 3;
    margin-top: -44px;
    padding-bottom: 60px;
  }
  .v5-details-card {
    background: white;
    border-radius: var(--v5-radius);
    box-shadow: var(--v5-shadow-lg);
    padding: 28px 24px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
    text-align: center;
  }
  .v5-stat {
    padding: 14px 8px;
    border-right: 1px solid var(--v5-border);
  }
  .v5-stat:last-child { border-right: none; }
  .v5-stat-icon { font-size: 1.4rem; color: var(--v5-accent); margin-bottom: 8px; }
  .v5-stat-value {
    font-family: 'Playfair Display', serif;
    font-size: 1.3rem; font-weight: 600;
    color: var(--v5-primary); display: block; line-height: 1;
    margin-bottom: 4px;
  }
  .v5-stat-label {
    font-size: 0.75rem; color: var(--v5-text-light);
    text-transform: uppercase; letter-spacing: 0.05em;
  }

  /* ── Description + Features ─────────────────────── */
  .v5-about-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 50px;
    align-items: start;
  }
  .v5-description-body { color: var(--v5-secondary); }
  .v5-description-body p {
    margin-bottom: 16px; font-size: 1.02rem; line-height: 1.8;
  }
  .v5-description-body h1,
  .v5-description-body h2,
  .v5-description-body h3 {
    font-family: 'Playfair Display', serif;
    color: var(--v5-primary); margin-bottom: 12px;
  }
  .v5-description-body ul,
  .v5-description-body ol { padding-left: 20px; margin-bottom: 16px; }

  .v5-features-card {
    background: var(--v5-bg-alt);
    padding: 28px;
    border-radius: var(--v5-radius);
    border-left: 4px solid var(--v5-accent);
    scroll-margin-top: 80px;
  }
  .v5-features-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.3rem; color: var(--v5-primary);
    margin-bottom: 18px;
  }
  .v5-features-list {
    list-style: none; padding: 0; margin: 0; display: grid; gap: 10px;
  }
  .v5-features-list li {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 0.95rem; color: var(--v5-secondary); line-height: 1.5;
  }
  .v5-features-list li::before {
    content: '✓';
    color: var(--v5-accent);
    font-weight: 700; font-size: 1rem;
    flex-shrink: 0; margin-top: 1px;
  }

  /* ── Gallery ────────────────────────────────────── */
  .v5-gallery-section { background: var(--v5-bg-alt); }
  .v5-gallery-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
  .v5-gallery-item {
    position: relative; overflow: hidden;
    border-radius: var(--v5-radius); cursor: pointer;
    aspect-ratio: 4/3;
    background: #E2E8F0;
  }
  .v5-gallery-item > div,
  .v5-gallery-item > span {
    width: 100% !important; height: 100% !important;
    display: block;
  }
  .v5-gallery-item img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.45s ease;
    display: block;
  }
  .v5-gallery-item:hover img { transform: scale(1.06); }
  .v5-gallery-item::after {
    content: '';
    position: absolute; inset: 0;
    background: rgba(15,23,42,0);
    transition: background 0.3s;
    pointer-events: none;
  }
  .v5-gallery-item:hover::after { background: rgba(15,23,42,0.3); }

  /* View All button (matches the V5 deep-slate + rounded styling) */
  .v5-view-all-wrap { margin-top: 36px; text-align: center; }
  .v4-view-all-wrap,
  .v5-view-all-wrap { margin-top: 36px; text-align: center; }
  .v4-view-all-btn,
  .v5-view-all-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: transparent;
    border: 2px solid var(--v5-primary);
    color: var(--v5-primary);
    padding: 12px 28px;
    border-radius: var(--v5-radius);
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem; font-weight: 600;
    cursor: pointer; transition: all 0.25s;
    line-height: 1.2;
  }
  .v4-view-all-btn:hover,
  .v5-view-all-btn:hover {
    background: var(--v5-primary); color: white;
    transform: translateY(-2px);
    box-shadow: var(--v5-shadow-md);
  }

  /* ── Floor plans ────────────────────────────────── */
  .v5-fp-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
  .v5-fp-card {
    background: var(--v5-bg-alt);
    border-radius: var(--v5-radius);
    overflow: hidden;
    border: 2px dashed var(--v5-border);
    transition: border-color 0.25s;
  }
  .v5-fp-card:hover { border-color: var(--v5-accent); }
  .v5-fp-img {
    aspect-ratio: 4/3; overflow: hidden; background: var(--v5-bg-alt);
    display: flex; align-items: center; justify-content: center;
  }
  .v5-fp-img img { width: 100%; height: 100%; object-fit: contain; padding: 16px; }
  .v5-fp-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--v5-border);
    display: flex; justify-content: space-between; align-items: center;
  }
  .v5-fp-name { font-size: 0.85rem; font-weight: 500; color: var(--v5-secondary); }
  .v5-fp-action {
    font-size: 0.75rem; color: var(--v5-accent); font-weight: 600;
    cursor: pointer; transition: color 0.2s;
    background: none; border: none; padding: 0;
    font-family: inherit;
  }
  .v5-fp-action:hover { color: var(--v5-accent-hover); text-decoration: underline; }

  /* ── Media (Video + Virtual Tour) ───────────────── */
  .v5-media-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 28px;
  }
  .v5-media-card {
    background: white;
    border-radius: var(--v5-radius);
    overflow: hidden;
    box-shadow: var(--v5-shadow-md);
    scroll-margin-top: 80px;
  }
  .v5-media-header {
    padding: 18px 20px;
    border-bottom: 1px solid var(--v5-border);
  }
  .v5-media-header h3 {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem; color: var(--v5-primary); margin: 0;
  }
  .v5-media-embed {
    position: relative; padding-bottom: 56.25%;
    height: 0; overflow: hidden; background: var(--v5-primary);
  }
  .v5-media-embed video,
  .v5-media-embed iframe {
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%; border: 0; object-fit: contain;
  }

  /* ── Contact ────────────────────────────────────── */
  .v5-contact-grid {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 40px;
    align-items: start;
  }
  .v5-contact-info {
    background: var(--v5-primary); color: white;
    padding: 40px; border-radius: var(--v5-radius);
  }
  .v5-contact-info-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.4rem; color: white; margin-bottom: 24px;
  }
  .v5-contact-info-photo {
    width: 72px; height: 72px;
    border-radius: 50%; object-fit: cover;
    border: 3px solid rgba(255,255,255,0.2);
    margin-bottom: 18px; display: block;
  }
  .v5-contact-info-name {
    font-size: 1.1rem; font-weight: 600; color: white; margin-bottom: 4px;
  }
  .v5-contact-info-company {
    font-size: 0.85rem; color: rgba(255,255,255,0.55);
    margin-bottom: 16px; display: block;
  }
  .v5-contact-info-logo {
    height: 24px; width: auto; object-fit: contain;
    opacity: 0.75; display: block; margin-bottom: 20px;
  }
  .v5-contact-divider {
    border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;
  }
  .v5-contact-detail {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 16px; font-size: 0.9rem;
    color: rgba(255,255,255,0.8);
  }
  .v5-contact-detail:last-child { margin-bottom: 0; }
  .v5-contact-detail a {
    color: rgba(255,255,255,0.8); text-decoration: none;
    transition: color 0.2s;
  }
  .v5-contact-detail a:hover { color: var(--v5-accent); }
  .v5-contact-icon {
    width: 38px; height: 38px; flex-shrink: 0;
    background: rgba(255,255,255,0.08);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: var(--v5-accent);
  }
  .v5-social-row {
    display: flex; flex-wrap: wrap; gap: 10px;
    margin-top: 20px; padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,0.1);
  }
  .v5-social-btn {
    width: 36px; height: 36px;
    background: rgba(255,255,255,0.08);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.7);
    text-decoration: none;
    transition: background 0.2s, color 0.2s;
  }
  .v5-social-btn:hover { background: var(--v5-accent); color: white; }

  /* ContactForm overrides for v5 */
  .v5-contact-form-wrap { background: white; padding: 40px; border-radius: var(--v5-radius); box-shadow: var(--v5-shadow-md); }
  .v5-contact-form-wrap input,
  .v5-contact-form-wrap textarea {
    border-radius: var(--v5-radius) !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 0.95rem !important;
  }
  .v5-contact-form-wrap input:focus,
  .v5-contact-form-wrap textarea:focus {
    border-color: var(--v5-accent) !important;
    box-shadow: 0 0 0 3px rgba(180,142,90,0.12) !important;
    outline: none !important;
  }
  .v5-contact-form-wrap button[type="submit"] {
    background: var(--v5-accent) !important;
    border-radius: var(--v5-radius) !important;
    font-family: 'Inter', sans-serif !important;
    font-weight: 600 !important;
    font-size: 0.9rem !important;
    transition: background 0.25s !important;
  }
  .v5-contact-form-wrap button[type="submit"]:hover:not(:disabled) {
    background: var(--v5-accent-hover) !important;
  }
  .v5-contact-form-label {
    font-family: 'Playfair Display', serif;
    font-size: 1.5rem; color: var(--v5-primary);
    margin-bottom: 6px; display: block;
  }
  .v5-contact-form-sub {
    font-size: 0.9rem; color: var(--v5-text-light);
    margin-bottom: 24px; display: block;
  }

  /* ── Map ─────────────────────────────────────────── */
  .v5-map-wrap {
    height: 450px; border-radius: var(--v5-radius);
    overflow: hidden; box-shadow: var(--v5-shadow-md);
  }
  .v5-map-wrap > div,
  .v5-map-wrap iframe { width: 100%; height: 100%; border: 0; }

  /* ── Footer ─────────────────────────────────────── */
  .v5-footer { background: var(--v5-primary); color: #94A3B8; padding: 56px 0 28px; }
  .v5-footer-top {
    display: flex; justify-content: space-between; align-items: flex-start;
    flex-wrap: wrap; gap: 32px;
    margin-bottom: 36px; padding-bottom: 36px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .v5-footer-links { display: flex; gap: 20px; align-items: center; }
  .v5-footer-links a { color: #94A3B8; text-decoration: none; font-size: 0.875rem; transition: color 0.2s; }
  .v5-footer-links a:hover { color: var(--v5-accent); }
  .v5-footer-legal { text-align: center; }
  .v5-footer-legal p {
    font-size: 0.8rem; color: #475569; line-height: 1.8; margin-bottom: 12px;
  }
  .v5-footer-powered { font-size: 0.825rem; color: #64748B; margin-top: 16px; }

  /* ── Responsive ─────────────────────────────────── */
  @media (max-width: 992px) {
    .v5-about-grid { grid-template-columns: 1fr; }
    .v5-media-grid { grid-template-columns: 1fr; }
    .v5-contact-grid { grid-template-columns: 1fr; }
    .v5-gallery-grid { grid-template-columns: repeat(2, 1fr); }
    .v5-fp-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 700px) {
    .v5-hero { height: auto; min-height: 90vw; padding: 48px 0 48px; }
    .v5-hero-inner { flex-direction: column; align-items: flex-start; }
    .v5-hero-card { width: 100%; min-width: auto; max-width: 100%; }
    .v5-details-card { grid-template-columns: repeat(2, 1fr); }
    .v5-stat { border-right: none; border-bottom: 1px solid var(--v5-border); }
    .v5-stat:nth-last-child(-n+2) { border-bottom: none; }
    .v5-gallery-grid { grid-template-columns: 1fr; }
    .v5-section { padding: 52px 0; }
    .v5-contact-info { padding: 28px 20px; }
    .v5-contact-form-wrap { padding: 28px 20px; }
    .v5-footer-top { flex-direction: column; gap: 20px; }
  }
`;

export default function PropertyTemplateV5({
  order,
  baseUrl,
}: {
  order: any;
  baseUrl: string;
}) {
  const realtorName = `${order.realtor.firstName} ${order.realtor.lastName}`;
  const fullUrl = `${baseUrl}/property/${order.id}/v5`;

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

  /* ── Photos ─────────────────────────────────────── */
  const photos = order.photos || [];
  const photoItems = photos.map((p: any) => ({
    src: p.urlMls || p.url,
    alt: p.filename,
  }));
  const displayPhotos = photos.slice(0, 6);

  /* ── Floor plans ─────────────────────────────────── */
  const floorPlans = order.floorPlans || [];
  const floorPlanItems = floorPlans.map((fp: any) => ({
    src: fp.url,
    alt: fp.filename,
  }));

  /* ── Embeds (virtual tour) ───────────────────────── */
  const iguide =
    (order.embeds || []).find((e: any) =>
      /iguide|matterport|tour/i.test(e.embedUrl)
    ) || (order.embeds || [])[0];

  /* ── Features ────────────────────────────────────── */
  const features: string[] = order.featuresText
    ? String(order.featuresText)
        .split(/\r?\n/)
        .map((ln: string) => ln.trim())
        .filter(Boolean)
    : [];

  /* ── Visibility flags ────────────────────────────── */
  const showFeatures   = features.length > 0;
  const showDescription = Boolean(order.description);
  const showPhotos     = photos.length > 0;
  const showFloorPlans = floorPlans.length > 0;
  const showVideo      = (order.videos || []).length > 0;
  const showTours      = Boolean(iguide);
  const showMap        = order.propertyLat != null && order.propertyLng != null;
  const showMedia      = showVideo || showTours;
  const showAbout      = showDescription || showFeatures;

  return (
    <>
      {/* ── Google Fonts ────────────────────────────── */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* ── Scoped styles ───────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: V5_STYLES }} />

      <div className="v5">

        {/* ════════════════════════════════════════════
            NAVIGATION
        ════════════════════════════════════════════ */}
        <V5NavMenu
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

        {/* ════════════════════════════════════════════
            HERO — slideshow + price/address + realtor card
        ════════════════════════════════════════════ */}
        <section className="v5-hero" id="overview">
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
          <div className="v5-hero-gradient" />

          {/* Hero content */}
          <div className="v5-hero-body">
            <div className="v5-container">
              <div className="v5-hero-inner">
                {/* Left: price + address */}
                <div className="v5-hero-text">
                  {priceFormatted && (
                    <div className="v5-hero-price">{priceFormatted}</div>
                  )}
                  <h1 className="v5-hero-address">{street}</h1>
                  {cityLine && (
                    <p className="v5-hero-city">{cityLine}</p>
                  )}
                </div>

                {/* Right: realtor card */}
                <div className="v5-hero-card">
                  {order.realtor.headshot && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="v5-hero-card-photo"
                      src={order.realtor.headshot}
                      alt={realtorName}
                    />
                  )}
                  <div className="v5-hero-card-info">
                    <p className="v5-hero-card-name">{realtorName}</p>
                    {order.realtor.companyName && (
                      <span className="v5-hero-card-company">
                        {order.realtor.companyName}
                      </span>
                    )}
                    {order.realtor.companyLogo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="v5-hero-card-logo"
                        src={order.realtor.companyLogo}
                        alt={order.realtor.companyName || 'Agency'}
                      />
                    )}
                    {phoneTel && (
                      <a href={phoneTel} className="v5-hero-card-phone">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        {order.realtor.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            PROPERTY DETAILS — stat card overlapping hero
        ════════════════════════════════════════════ */}
        <section id="details" style={{ scrollMarginTop: '80px' }}>
          <div className="v5-container v5-details-wrap">
            <div className="v5-details-card">
              <div className="v5-stat">
                <div className="v5-stat-icon">🛏</div>
                <span className="v5-stat-value">{order.bedrooms ?? '—'}</span>
                <span className="v5-stat-label">Bedrooms</span>
              </div>
              <div className="v5-stat">
                <div className="v5-stat-icon">🛁</div>
                <span className="v5-stat-value">{order.bathrooms ?? '—'}</span>
                <span className="v5-stat-label">Bathrooms</span>
              </div>
              <div className="v5-stat">
                <div className="v5-stat-icon">📐</div>
                <span className="v5-stat-value">{order.propertySize ?? '—'}</span>
                <span className="v5-stat-label">Sq Ft</span>
              </div>
              <div className="v5-stat">
                <div className="v5-stat-icon">📅</div>
                <span className="v5-stat-value">{order.yearBuilt ?? '—'}</span>
                <span className="v5-stat-label">Year Built</span>
              </div>
              <div className="v5-stat">
                <div className="v5-stat-icon">🏷</div>
                <span className="v5-stat-value" style={{ fontSize: '1rem' }}>
                  {order.mlsNumber || '—'}
                </span>
                <span className="v5-stat-label">MLS® Number</span>
              </div>
              {priceFormatted && (
                <div className="v5-stat">
                  <div className="v5-stat-icon">💰</div>
                  <span className="v5-stat-value" style={{ fontSize: '1rem' }}>
                    {priceFormatted}
                  </span>
                  <span className="v5-stat-label">List Price</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            DESCRIPTION + FEATURES — 2-column about grid
        ════════════════════════════════════════════ */}
        {showAbout && (
          <section
            id="description"
            className="v5-section"
            style={{ background: 'var(--v5-bg)', scrollMarginTop: '80px' }}
          >
            <div className="v5-container">
              <div className={showDescription && showFeatures ? 'v5-about-grid' : ''}>
                {/* Description column */}
                {showDescription && (
                  <div>
                    <span className="v5-badge">Property Info</span>
                    <h2
                      className="v5-serif"
                      style={{
                        fontSize: 'clamp(1.6rem,3.5vw,2.2rem)',
                        color: 'var(--v5-primary)',
                        marginBottom: '24px',
                        lineHeight: 1.2,
                      }}
                    >
                      Property Description
                    </h2>
                    <div
                      className="v5-description-body"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeDescription(
                          String(order.description).replace(
                            /^(<br\s*\/?\>)+/i,
                            ''
                          )
                        ),
                      }}
                    />
                  </div>
                )}

                {/* Features column */}
                {showFeatures && (
                  <div
                    id="features"
                    className="v5-features-card"
                    style={{ scrollMarginTop: '80px' }}
                  >
                    <h3 className="v5-features-title">Main Features</h3>
                    <ul className="v5-features-list">
                      {features.map((feat, i) => (
                        <li key={i}>{feat}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════
            PHOTO GALLERY — 3-column grid
        ════════════════════════════════════════════ */}
        {showPhotos && (
          <section
            id="photos"
            className="v5-section v5-gallery-section"
            style={{ scrollMarginTop: '80px' }}
          >
            <div className="v5-container">
              <h2 className="v5-section-title">Photo Gallery</h2>
              <p className="v5-section-subtitle">
                Explore every angle of this stunning property
              </p>

              <div className="v5-gallery-grid">
                {displayPhotos.map((p: any, i: number) => (
                  <div key={p.id} className="v5-gallery-item">
                    <PhotoLightbox
                      src={p.urlMls || p.url}
                      alt={p.filename}
                      items={photoItems}
                      startIndex={i}
                      thumbClassName="w-full h-full object-cover cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              {/* View All button */}
              <div className="v5-view-all-wrap">
                <V4GalleryTrigger
                  items={photoItems}
                  count={photos.length}
                />
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════
            FLOOR PLANS
        ════════════════════════════════════════════ */}
        {showFloorPlans && (
          <section
            id="floorplans"
            className="v5-section"
            style={{ background: 'var(--v5-bg)', scrollMarginTop: '80px' }}
          >
            <div className="v5-container">
              <h2 className="v5-section-title">Floor Plans</h2>
              <p className="v5-section-subtitle">
                Review the layout and dimensions
              </p>
              <div className="v5-fp-grid">
                {floorPlans.map((f: any, i: number) => (
                  <V5FloorPlanCard
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
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════
            MEDIA — Video Tour + Virtual Tour (side by side)
        ════════════════════════════════════════════ */}
        {showMedia && (
          <section
            className="v5-section"
            style={{ background: 'var(--v5-bg-alt)', scrollMarginTop: '80px' }}
          >
            <div className="v5-container">
              <h2 className="v5-section-title">Property Media</h2>
              <p className="v5-section-subtitle">
                Take a closer look at everything this home has to offer
              </p>
              <div className={showVideo && showTours ? 'v5-media-grid' : ''}>
                {showVideo && (
                  <div id="video" className="v5-media-card">
                    <div className="v5-media-header">
                      <h3>Video Tour</h3>
                    </div>
                    <div className="v5-media-embed">
                      <video controls>
                        <source src={order.videos[0].url} />
                      </video>
                    </div>
                  </div>
                )}
                {showTours && (
                  <div id="tours" className="v5-media-card">
                    <div className="v5-media-header">
                      <h3>3D Virtual Tour</h3>
                    </div>
                    <div className="v5-media-embed">
                      <iframe
                        src={iguide.embedUrl}
                        title={iguide.title || 'Virtual Tour'}
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════
            CONTACT — dark card + form
        ════════════════════════════════════════════ */}
        <section
          id="contact"
          className="v5-section"
          style={{ scrollMarginTop: '80px' }}
        >
          <div className="v5-container">
            <h2 className="v5-section-title">Schedule a Viewing</h2>
            <p className="v5-section-subtitle">
              Interested in this property? Get in touch today.
            </p>

            <div className="v5-contact-grid">
              {/* Realtor info card */}
              <div className="v5-contact-info">
                <h3 className="v5-contact-info-title">Listing Agent</h3>

                {order.realtor.headshot && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="v5-contact-info-photo"
                    src={order.realtor.headshot}
                    alt={realtorName}
                  />
                )}

                <p className="v5-contact-info-name">{realtorName}</p>
                {order.realtor.companyName && (
                  <span className="v5-contact-info-company">
                    {order.realtor.companyName}
                  </span>
                )}
                {order.realtor.companyLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="v5-contact-info-logo"
                    src={order.realtor.companyLogo}
                    alt={order.realtor.companyName || 'Agency'}
                  />
                )}

                <hr className="v5-contact-divider" />

                {phoneTel && (
                  <div className="v5-contact-detail">
                    <span className="v5-contact-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <a href={phoneTel}>{order.realtor.phone}</a>
                  </div>
                )}

                {order.realtor.email && (
                  <div className="v5-contact-detail">
                    <span className="v5-contact-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <a href={`mailto:${order.realtor.email}`}>
                      {order.realtor.email}
                    </a>
                  </div>
                )}

                {/* Social links */}
                {(order.realtor.facebookUrl ||
                  order.realtor.linkedinUrl ||
                  order.realtor.instagramUrl ||
                  order.realtor.youtubeUrl ||
                  order.realtor.twitterUrl ||
                  order.realtor.tiktokUrl) && (
                  <div className="v5-social-row">
                    {order.realtor.facebookUrl && (
                      <a
                        href={order.realtor.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="v5-social-btn"
                        aria-label="Facebook"
                      >
                        <Facebook size={15} />
                      </a>
                    )}
                    {order.realtor.linkedinUrl && (
                      <a
                        href={order.realtor.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="v5-social-btn"
                        aria-label="LinkedIn"
                      >
                        <Linkedin size={15} />
                      </a>
                    )}
                    {order.realtor.instagramUrl && (
                      <a
                        href={order.realtor.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="v5-social-btn"
                        aria-label="Instagram"
                      >
                        <Instagram size={15} />
                      </a>
                    )}
                    {order.realtor.youtubeUrl && (
                      <a
                        href={order.realtor.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="v5-social-btn"
                        aria-label="YouTube"
                      >
                        <Youtube size={15} />
                      </a>
                    )}
                    {order.realtor.twitterUrl && (
                      <a
                        href={order.realtor.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="v5-social-btn"
                        aria-label="Twitter/X"
                      >
                        <XIcon width={15} height={15} />
                      </a>
                    )}
                    {order.realtor.tiktokUrl && (
                      <a
                        href={order.realtor.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="v5-social-btn"
                        aria-label="TikTok"
                      >
                        <TikTokIcon width={15} height={15} />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Contact form */}
              <div className="v5-contact-form-wrap">
                <span className="v5-contact-form-label">Get in Touch</span>
                <span className="v5-contact-form-sub">
                  Questions or ready to book? We&apos;d love to hear from you.
                </span>
                <ContactForm orderId={order.id} />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            MAP
        ════════════════════════════════════════════ */}
        {showMap && (
          <section
            id="map"
            className="v5-section"
            style={{ background: 'var(--v5-bg-alt)', scrollMarginTop: '80px' }}
          >
            <div className="v5-container">
              <div className="v5-map-wrap">
                <MapWithMarker
                  lat={order.propertyLat}
                  lng={order.propertyLng}
                />
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════════ */}
        <footer className="v5-footer">
          <div className="v5-container">
            <div className="v5-footer-top">
              {/* CREA trademark logos */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/crea-logos.png"
                alt="REALTOR and MLS trademarks"
                style={{ height: '36px', width: 'auto', objectFit: 'contain', opacity: 0.85 }}
              />
              <div className="v5-footer-links">
                <a
                  href="https://photos4realestate.ca/terms-and-conditions/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms
                </a>
                <a
                  href="https://photos4realestate.ca/privacy-policy/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy
                </a>
              </div>
            </div>

            <div className="v5-footer-legal">
              <p>
                The trademarks REALTOR®, REALTORS®, and the REALTOR® logo are
                controlled by The Canadian Real Estate Association (CREA) and
                identify real estate professionals who are members of CREA.
              </p>
              <p>
                The trademarks MLS®, Multiple Listing Service® and the
                associated logos are owned by The Canadian Real Estate
                Association (CREA) and identify the quality of services
                provided by real estate professionals who are members of CREA.
                Used under license.
              </p>
              <p className="v5-footer-powered">
                Powered by{' '}
                <a
                  href="https://photos4realestate.ca/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--v5-accent)', textDecoration: 'none' }}
                >
                  Photos 4 Real Estate
                </a>{' '}
                · © {new Date().getFullYear()} All Rights Reserved
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
