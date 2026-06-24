'use client';

/* ─────────────────────────────────────────────────────────────────
   V6MobileBar
   Fixed stick bar at the bottom of the screen on mobile / tablet
   (< 1024px). Hidden on desktop where the sticky card is shown.
   ── "Call Now" → tel: link
   ── "Message"  → smooth-scrolls to the #contact section
───────────────────────────────────────────────────────────────── */
export default function V6MobileBar({
  realtorName,
  phone,
  priceFormatted,
}: {
  realtorName: string;
  phone?: string | null;
  priceFormatted?: string;
}) {
  const scrollToContact = () =>
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="v6-mobile-bar">
      <div className="v6-mobile-bar-inner">
        {/* Left: realtor name + price */}
        <div className="v6-mobile-bar-info">
          <p className="v6-mobile-bar-by">Listed by {realtorName}</p>
          {priceFormatted && (
            <p className="v6-mobile-bar-price">{priceFormatted}</p>
          )}
        </div>

        {/* Right: CTA buttons */}
        <div className="v6-mobile-bar-actions">
          {phone && (
            <a
              href={`tel:${String(phone).replace(/[^+\d]/g, '')}`}
              className="v6-mobile-bar-call"
            >
              Call Now
            </a>
          )}
          <button
            type="button"
            className="v6-mobile-bar-message"
            onClick={scrollToContact}
          >
            Message
          </button>
        </div>
      </div>
    </div>
  );
}
