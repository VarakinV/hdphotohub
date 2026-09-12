import type { CSSProperties, ReactElement } from 'react';
import {
  POST_HEIGHT,
  POST_WIDTH,
  type SocialPostInput,
  type SocialPostProperty,
  type SocialPostRealtor,
  type SocialPostRenderProps,
} from './types';
import {
  BRAND,
  BRAND_DARK,
  DARK,
  FONT_DISPLAY,
  FONT_INSTRUMENT,
  FONT_SANS,
  FONT_SCRIPT,
  FONT_SERIF,
  GOLD,
  INK,
  LINE,
  MUTED,
  NL1_BAND,
  PAPER,
  bathIcon,
  bedIcon,
  checkIcon,
  phoneIcon,
  pinIcon,
  sqftIcon,
} from './theme';

type Style = CSSProperties;

const ROOT: Style = {
  width: POST_WIDTH,
  height: POST_HEIGHT,
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  background: PAPER,
  fontFamily: FONT_SANS,
  color: INK,
};

function formatPrice(v?: number | null): string {
  if (!v) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

function fmtNum(v?: number | string | null): string {
  if (v == null) return '';
  if (typeof v === 'number') return v.toLocaleString('en-US');
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString('en-US') : String(v);
}

function Cover({ src, style }: { src?: string; style?: Style }) {
  if (!src) {
    return (
      <div
        style={{
          ...style,
          backgroundImage: 'linear-gradient(135deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
        }}
      />
    );
  }
  return <img src={src} alt="" style={{ ...style, objectFit: 'cover' }} />;
}

function Overlay({ from, via, to, style }: { from: string; via: string; to: string; style?: Style }) {
  return <div style={{ ...style, position: 'absolute', backgroundImage: `linear-gradient(to top, ${from}, ${via} 45%, ${to})` }} />;
}

function Headline({ text, style }: { text?: string | null; style?: Style }) {
  if (!text) return null;
  return (
    <div
      style={{
        fontFamily: FONT_SERIF,
        fontWeight: 800,
        fontSize: 88,
        letterSpacing: 1,
        textTransform: 'uppercase',
        lineHeight: 1.02,
        textAlign: 'center',
        color: PAPER,
        ...style,
      }}
    >
      {text}
    </div>
  );
}

function Display({ text, style }: { text?: string | null; style?: Style }) {
  if (!text) return null;
  return (
    <div
      style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 120,
        letterSpacing: 2,
        lineHeight: 1,
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {text}
    </div>
  );
}

function Address({ property, style, color }: { property: SocialPostProperty; style?: Style; color?: string }) {
  const cityLine = property.city ? `${property.city}` : '';
  const textColor = color || PAPER;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ...style }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <img src={pinIcon(textColor)} alt="" style={{ width: 30, height: 30, marginRight: 8 }} />
        <div
          style={{
            fontFamily: FONT_SANS,
            fontWeight: 800,
            fontSize: 40,
            color: textColor,
            lineHeight: 1.1,
            wordBreak: 'break-word',
            textAlign: 'center',
          }}
        >
          {property.address}
        </div>
      </div>
      {cityLine ? (
        <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 26, color: textColor, opacity: 0.85, marginTop: 6, textAlign: 'center' }}>
          {cityLine}
        </div>
      ) : null}
    </div>
  );
}

function StatChip({ icon, value, label, dark }: { icon: string; value: string; label: string; dark?: boolean }) {
  const bg = dark ? 'rgba(255,255,255,0.12)' : PAPER;
  const border = dark ? '1px solid rgba(255,255,255,0.28)' : `1px solid ${LINE}`;
  const valColor = dark ? PAPER : INK;
  const labColor = dark ? 'rgba(255,255,255,0.78)' : MUTED;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 26px', borderRadius: 14, background: bg, border, minWidth: 168 }}>
      <img src={icon} alt="" style={{ width: 30, height: 30 }} />
      <div style={{ fontSize: 32, fontWeight: 800, color: valColor, marginTop: 8, lineHeight: 1.05 }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: labColor, marginTop: 4, letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

function StatsRow({ property, dark }: { property: SocialPostProperty; dark?: boolean }) {
  const items: Array<{ icon: string; value: string; label: string }> = [];
  if (property.bedrooms) items.push({ icon: bedIcon(dark ? PAPER : BRAND), value: fmtNum(property.bedrooms), label: 'Beds' });
  if (property.bathrooms) items.push({ icon: bathIcon(dark ? PAPER : BRAND), value: fmtNum(property.bathrooms), label: 'Baths' });
  if (property.sqft) items.push({ icon: sqftIcon(dark ? PAPER : BRAND), value: fmtNum(property.sqft), label: 'Sq Ft' });
  if (!items.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      {items.map((it, i) => (
        <div key={it.label} style={{ display: 'flex', flexDirection: 'column', marginRight: i < items.length - 1 ? 16 : 0 }}>
          <StatChip icon={it.icon} value={it.value} label={it.label} dark={dark} />
        </div>
      ))}
    </div>
  );
}

function AgentBar({ realtor, dark, hideLogo }: { realtor: SocialPostRealtor; dark?: boolean; hideLogo?: boolean }) {
  const textColor = dark ? PAPER : INK;
  const subColor = dark ? 'rgba(255,255,255,0.8)' : MUTED;
  const hasHeadshot = !!realtor.headshotUrl;
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        {hasHeadshot ? (
          <img
            src={realtor.headshotUrl!}
            alt=""
            style={{ width: 108, height: 108, borderRadius: 54, objectFit: 'cover', marginRight: 20, border: `3px solid ${dark ? 'rgba(255,255,255,0.4)' : BRAND}` }}
          />
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: textColor, lineHeight: 1.1 }}>{realtor.name}</div>
          {realtor.companyName ? (
            <div style={{ fontSize: 20, fontWeight: 600, color: subColor, marginTop: 2 }}>{realtor.companyName}</div>
          ) : null}
          {realtor.phone ? (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <img src={phoneIcon(dark ? PAPER : BRAND)} alt="" style={{ width: 22, height: 22, marginRight: 8 }} />
              <div style={{ fontSize: 24, fontWeight: 700, color: textColor }}>{realtor.phone}</div>
            </div>
          ) : null}
        </div>
      </div>
      {realtor.logoUrl && !hideLogo ? (
        <img src={realtor.logoUrl} alt="" style={{ maxWidth: 220, maxHeight: 120, objectFit: 'contain' }} />
      ) : null}
    </div>
  );
}

function PhotoRow({ images, heights }: { images: string[]; heights: number[] }) {
  const count = Math.min(images.length, 3);
  const list = images.slice(0, count);
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}>
      {list.map((src, i) => (
        <Cover
          key={i}
          src={src}
          style={{ width: 1080 / count, height: heights[Math.min(i, heights.length - 1)], borderRight: i < list.length - 1 ? 8 : 0 }}
        />
      ))}
    </div>
  );
}

function Page({ children, style }: { children: ReactElement | ReactElement[]; style?: Style }) {
  return (
    <div style={{ ...ROOT, ...style }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', padding: 64, boxSizing: 'border-box', width: POST_WIDTH, height: POST_HEIGHT }}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------- templates

function TComingSoon(p: SocialPostRenderProps) {
  return (
    <div style={ROOT}>
      <Cover src={p.images[0]} style={{ width: '100%', height: '100%' }} />
      <Overlay from="rgba(0,0,0,0.88)" via="rgba(0,0,0,0.32) 45%" to="rgba(0,0,0,0.45)" style={{ top: 0, left: 0, right: 0, bottom: 0 }} />
      <div style={{ position: 'absolute', top: 64, left: 64, right: 64, bottom: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {p.realtor.logoUrl ? <img src={p.realtor.logoUrl} alt="" style={{ maxWidth: 260, maxHeight: 120, objectFit: 'contain', marginBottom: 28 }} /> : null}
          <Headline text={p.label || 'Coming Soon'} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Address property={p.property} />
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 26 }}>
            <StatsRow property={p.property} dark />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.3)', width: '100%' }}>
          <AgentBar realtor={p.realtor} dark hideLogo />
        </div>
      </div>
    </div>
  );
}

function TJustListed(p: SocialPostRenderProps) {
  const photoH = 640;
  return (
    <div style={ROOT}>
      <Page>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: BRAND,
              color: PAPER,
              fontFamily: FONT_DISPLAY,
              fontSize: 30,
              letterSpacing: 3,
              padding: '10px 22px',
              borderRadius: 10,
            }}
          >
            {p.label || 'JUST LISTED'}
          </div>
          {p.realtor.logoUrl ? <img src={p.realtor.logoUrl} alt="" style={{ maxWidth: 200, maxHeight: 84, objectFit: 'contain' }} /> : null}
        </div>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <Cover src={p.images[0]} style={{ width: 464, height: photoH, borderRadius: 18, marginRight: 16 }} />
          <Cover src={p.images[1] || p.images[0]} style={{ width: 464, height: photoH, borderRadius: 18 }} />
        </div>
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Address property={p.property} color={INK} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <StatsRow property={p.property} />
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 26, paddingTop: 22, borderTop: `2px solid ${BRAND}` }}>
            <AgentBar realtor={p.realtor} />
          </div>
        </div>
      </Page>
    </div>
  );
}

function TNewListing(p: SocialPostRenderProps) {
  return (
    <div style={ROOT}>
      <Cover src={p.images[0]} style={{ width: '100%', height: 700 }} />
      <Page style={{ position: 'absolute', inset: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Display text={p.label || 'New Listing'} style={{ color: INK, fontSize: 96 }} />
          <div style={{ width: 90, height: 6, background: BRAND, marginTop: 16 }} />
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 20 }}>
            <Address property={p.property} color={INK} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 30 }}>
            <StatsRow property={p.property} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 34, paddingTop: 24, borderTop: `2px solid ${BRAND}` }}>
            <AgentBar realtor={p.realtor} />
          </div>
        </div>
      </Page>
    </div>
  );
}

function TNewOnMarket(p: SocialPostRenderProps) {
  return (
    <div style={ROOT}>
      <div style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
        <Cover src={p.images[0]} style={{ width: 600, height: '100%' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '56px 48px', boxSizing: 'border-box', background: PAPER }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignSelf: 'flex-start',
              background: BRAND,
              color: PAPER,
              fontFamily: FONT_DISPLAY,
              fontSize: 30,
              letterSpacing: 3,
              padding: '10px 22px',
              borderRadius: 10,
            }}
          >
            {p.label || 'NEW ON THE MARKET'}
          </div>
          <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: FONT_SERIF, fontWeight: 800, fontSize: 56, lineHeight: 1.05, color: INK, wordBreak: 'break-word' }}>
              {p.property.address}
            </div>
            <div style={{ fontSize: 26, fontWeight: 600, color: MUTED, marginTop: 8 }}>
              {[p.property.city, p.property.province].filter(Boolean).join(', ')}
            </div>
          </div>
          {p.property.listPrice ? (
            <div style={{ fontSize: 44, fontWeight: 800, color: BRAND, marginTop: 22 }}>{formatPrice(p.property.listPrice)}</div>
          ) : null}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column' }}>
            <StatsRow property={p.property} />
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 26, paddingTop: 20, borderTop: `2px solid ${BRAND}` }}>
              <AgentBar realtor={p.realtor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TForSale(p: SocialPostRenderProps) {
  return (
    <div style={ROOT}>
      <Cover src={p.images[0]} style={{ width: '100%', height: 820 }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: 0, boxSizing: 'border-box' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} />
        <div style={{ display: 'flex', flexDirection: 'column', background: PAPER, padding: '44px 64px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Display text={p.label || 'For Sale'} style={{ color: BRAND, fontSize: 110 }} />
            {p.property.listPrice ? (
              <div style={{ fontSize: 40, fontWeight: 800, color: INK, marginTop: 10 }}>{formatPrice(p.property.listPrice)}</div>
            ) : null}
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 16 }}>
              <Address property={p.property} color={INK} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 24 }}>
              <StatsRow property={p.property} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 24, paddingTop: 20, borderTop: `2px solid ${BRAND}` }}>
              <AgentBar realtor={p.realtor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TFeaturedListing(p: SocialPostRenderProps) {
  return (
    <div style={{ ...ROOT, background: DARK }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 64px', boxSizing: 'border-box' }}>
        <Headline text={p.label || 'Featured Listing'} style={{ fontSize: 64, color: GOLD }} />
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 22 }}>
          <div style={{ width: 64, height: 4, background: GOLD, marginRight: 14 }} />
          <div style={{ fontFamily: FONT_SERIF, fontWeight: 800, fontSize: 44, color: PAPER, textAlign: 'center' }}>{p.property.address}</div>
          <div style={{ width: 64, height: 4, background: GOLD, marginLeft: 14 }} />
        </div>
        <Cover
          src={p.images[0]}
          style={{ width: 872, height: 620, borderRadius: 20, border: `6px solid ${BRAND}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', marginTop: 26 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 28 }}>
          <StatsRow property={p.property} dark />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', width: '100%', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <AgentBar realtor={p.realtor} dark />
        </div>
      </div>
    </div>
  );
}

function TPriceReduced(p: SocialPostRenderProps) {
  return (
    <div style={ROOT}>
      <Cover src={p.images[0]} style={{ width: '100%', height: 780 }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} />
        <div style={{ display: 'flex', flexDirection: 'column', background: PAPER, padding: '40px 64px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: BRAND,
                color: PAPER,
                fontFamily: FONT_DISPLAY,
                fontSize: 34,
                letterSpacing: 3,
                padding: '10px 26px',
                borderRadius: 999,
              }}
            >
              {p.label || 'PRICE REDUCED'}
            </div>
            {p.property.listPrice ? (
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', marginTop: 16 }}>
                <div style={{ fontSize: 30, fontWeight: 600, color: MUTED, textDecoration: 'line-through', marginRight: 16 }}>
                  {formatPrice(Math.round((p.property.listPrice * 1.05) / 1000) * 1000)}
                </div>
                <div style={{ fontSize: 58, fontWeight: 800, color: BRAND }}>{formatPrice(p.property.listPrice)}</div>
              </div>
            ) : null}
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
              <Address property={p.property} color={INK} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 20 }}>
              <StatsRow property={p.property} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 20, paddingTop: 18, borderTop: `2px solid ${BRAND}` }}>
              <AgentBar realtor={p.realtor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TOpenHouse(p: SocialPostRenderProps) {
  return (
    <div style={ROOT}>
      <Cover src={p.images[0]} style={{ width: '100%', height: '100%' }} />
      <Overlay from="rgba(10,20,40,0.9)" via="rgba(10,20,40,0.4) 50%" to="rgba(10,20,40,0.55)" style={{ top: 0, left: 0, right: 0, bottom: 0 }} />
      <div style={{ position: 'absolute', top: 64, left: 64, right: 64, bottom: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Headline text={p.label || 'Open House'} />
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 18 }}>
            <Address property={p.property} />
          </div>
        </div>
        {p.qrDataUrl ? (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', background: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 22, boxShadow: '0 18px 60px rgba(0,0,0,0.35)' }}>
            <img src={p.qrDataUrl} alt="" style={{ width: 190, height: 190 }} />
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 24, maxWidth: 260 }}>
              <div style={{ fontFamily: FONT_SERIF, fontWeight: 800, fontSize: 34, color: INK, lineHeight: 1.05 }}>Scan to view this property</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: MUTED, marginTop: 8 }}>Photos, details &amp; more</div>
            </div>
          </div>
        ) : null}
        <div style={{ width: '100%', paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column' }}>
          <StatsRow property={p.property} dark />
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 22 }}>
            <AgentBar realtor={p.realtor} dark />
          </div>
        </div>
      </div>
    </div>
  );
}

function TUnderContract(p: SocialPostRenderProps) {
  return (
    <div style={ROOT}>
      <Cover src={p.images[0]} style={{ width: '100%', height: '100%' }} />
      <Overlay from="rgba(20,32,56,0.92)" via="rgba(20,32,56,0.55) 45%" to="rgba(20,32,56,0.6)" style={{ top: 0, left: 0, right: 0, bottom: 0 }} />
      <div style={{ position: 'absolute', top: 64, left: 64, right: 64, bottom: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Headline text={p.label || 'Under Contract'} style={{ fontSize: 76 }} />
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 16 }}>
            <Address property={p.property} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999, padding: '12px 26px' }}>
          <img src={checkIcon(PAPER)} alt="" style={{ width: 26, height: 26, marginRight: 12 }} />
          <div style={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 24, color: PAPER, letterSpacing: 1 }}>SALES COMPLETE SOON</div>
        </div>
        <div style={{ width: '100%', paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column' }}>
          <StatsRow property={p.property} dark />
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 22 }}>
            <AgentBar realtor={p.realtor} dark />
          </div>
        </div>
      </div>
    </div>
  );
}

function TSold(p: SocialPostRenderProps) {
  return (
    <div style={ROOT}>
      <Cover src={p.images[0]} style={{ width: '100%', height: 830 }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} />
        <div style={{ display: 'flex', flexDirection: 'column', background: PAPER, padding: '36px 64px 44px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', transform: 'rotate(-3deg)' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: BRAND,
                  color: PAPER,
                  fontFamily: FONT_DISPLAY,
                  fontSize: 110,
                  letterSpacing: 4,
                  padding: '6px 56px',
                  borderRadius: 14,
                  boxShadow: '0 14px 40px rgba(202,65,83,0.35)',
                }}
              >
                {p.label || 'SOLD'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 22 }}>
              <Address property={p.property} color={INK} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 20 }}>
              <StatsRow property={p.property} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 18, paddingTop: 18, borderTop: `2px solid ${BRAND}` }}>
              <AgentBar realtor={p.realtor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TSold1(p: SocialPostRenderProps) {
  const panel = 'rgba(48,65,61,0.9)';
  const white = '#FFFFFF';
  const hero = p.images[0];
  const labelWords = (p.label || 'JUST SOLD').trim().split(/\s+/);
  const firstLine = labelWords[0] || 'JUST';
  const secondLine = labelWords.slice(1).join(' ') || 'SOLD';
  const cityDetails = [p.property.city, [p.property.province, p.property.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const addressIncludesCity = Boolean(p.property.address && p.property.city && p.property.address.toLowerCase().includes(p.property.city.toLowerCase()));
  const addressStreet = p.property.address || '';
  const addressCity = addressIncludesCity ? '' : cityDetails;
  const frame = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 402 470" width="402" height="470"><path d="M2 0 V400 L201 468 L400 400 V0" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/></svg>`
  )}`;
  const stat = (text: string, isLast = false) => (
    <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 34, color: white, lineHeight: 1.2, letterSpacing: 0.5, marginBottom: isLast ? 0 : 13 }}>{text}</div>
  );
  return (
    <div style={{ ...ROOT, background: '#1F2927' }}>
      <Cover src={hero} style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 1350 }} />
      <div style={{ position: 'absolute', top: 0, left: 97, width: 494, height: 1350, background: panel, display: 'flex' }} />
      <img src={frame} alt="" style={{ position: 'absolute', top: 0, left: 136, width: 402, height: 470 }} />
      {p.realtor.logoUrl ? <img src={p.realtor.logoUrl} alt="" style={{ position: 'absolute', top: 35, left: 235, width: 204, height: 74, objectFit: 'contain' }} /> : null}
      <div style={{ position: 'absolute', top: 126, left: 136, width: 402, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 108, color: white, lineHeight: 0.98 }}>{firstLine}</div>
        <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 108, color: white, lineHeight: 0.98, marginTop: 7 }}>{secondLine}</div>
      </div>
      <div style={{ position: 'absolute', top: 526, left: 97, width: 494, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {p.property.bedrooms ? stat(`${String(p.property.bedrooms)} BEDROOMS`) : null}
        {p.property.bathrooms ? stat(`${String(p.property.bathrooms)} BATHROOMS`) : null}
        {p.property.sqft ? stat(`${String(p.property.sqft)} SQ FT`, true) : null}
      </div>
      {addressStreet ? (
        <div style={{ position: 'absolute', top: 708, left: 145, width: 385, borderTop: `3px solid ${white}`, paddingTop: 19, display: 'flex', justifyContent: 'center', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', width: 385, flexDirection: 'column', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 29, color: white, lineHeight: 1.22, textAlign: 'center', textTransform: 'uppercase' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>{addressStreet}{addressCity ? ',' : ''}</div>
            {addressCity ? <div style={{ display: 'flex', justifyContent: 'center' }}>{addressCity}</div> : null}
          </div>
        </div>
      ) : null}
      {p.realtor.headshotUrl ? <img src={p.realtor.headshotUrl} alt="" style={{ position: 'absolute', top: 983, left: 145, width: 145, height: 145, borderRadius: 73, objectFit: 'cover' }} /> : null}
      <div style={{ position: 'absolute', top: 1140, left: 150, width: 400, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 39, color: white, lineHeight: 1.15 }}>{p.realtor.name}</div>
        {p.realtor.phone ? <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 39, color: white, lineHeight: 1.15, marginTop: 12 }}>{p.realtor.phone}</div> : null}
      </div>
    </div>
  );
}

function TSold2(p: SocialPostRenderProps) {
  const gold = '#A08055';
  const black = '#000000';
  const hero = p.images[0];
  const label = (p.label || 'JUST SOLD!').toUpperCase();
  const cityDetails = [p.property.city, [p.property.province, p.property.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const addressLine = p.property.address
    ? p.property.city && p.property.address.toLowerCase().includes(p.property.city.toLowerCase())
      ? p.property.address
      : [p.property.address, cityDetails].filter(Boolean).join(', ')
    : '';
  const curveMask = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 150" width="1080" height="150"><path d="M0 0 H1080 V10 Q 540 280 0 10 Z" fill="#ffffff"/></svg>`
  )}`;
  const pinBadge = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="49" fill="#ffffff"/><path d="M50 84 C38 68 30 58 30 47 a20 20 0 1 1 40 0 C70 58 62 68 50 84 Z" fill="${gold}"/><circle cx="50" cy="47" r="8" fill="#ffffff"/></svg>`
  )}`;
  const dotGrid = (cols: number, rows: number, gap: number, size: number, color: string) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {Array.from({ length: rows }, (_, y) => (
        <div key={y} style={{ display: 'flex', flexDirection: 'row', marginBottom: y < rows - 1 ? gap : 0 }}>
          {Array.from({ length: cols }, (_, x) => (
            <div key={x} style={{ display: 'flex', width: size, height: size, borderRadius: size / 2, background: color, marginRight: x < cols - 1 ? gap : 0 }} />
          ))}
        </div>
      ))}
    </div>
  );
  return (
    <div style={{ ...ROOT, background: PAPER }}>
      <Cover src={hero} style={{ position: 'absolute', top: 330, left: 0, width: 1080, height: 690 }} />
      <img src={curveMask} alt="" style={{ position: 'absolute', top: 320, left: 0, width: 1080, height: 150 }} />
      <div style={{ position: 'absolute', top: 1020, left: 0, width: 1080, height: 330, background: black, display: 'flex' }} />
      <img src={pinBadge} alt="" style={{ position: 'absolute', top: 365, left: 478, width: 124, height: 124 }} />
      <div style={{ position: 'absolute', top: 28, left: 0, width: 1080, display: 'flex', justifyContent: 'center', fontFamily: FONT_SCRIPT, fontSize: 118, lineHeight: 1, color: gold }}>This House</div>
      <div style={{ position: 'absolute', top: 172, left: 0, width: 1080, display: 'flex', justifyContent: 'center', fontFamily: FONT_SERIF, fontWeight: 800, fontSize: 112, lineHeight: 1, color: '#0A0A0A', letterSpacing: 2 }}>{label}</div>
      {addressLine ? (
        <div style={{ position: 'absolute', top: 300, left: 0, width: 1080, display: 'flex', justifyContent: 'center', fontFamily: FONT_SERIF, fontWeight: 400, fontSize: 28, color: '#141414' }}>{addressLine}</div>
      ) : null}
      {p.realtor.phone ? (
        <div style={{ position: 'absolute', top: 955, left: 110, width: 465, height: 88, background: gold, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 44, color: PAPER }}>{p.realtor.phone}</div>
        </div>
      ) : null}
      {p.realtor.headshotUrl ? <img src={p.realtor.headshotUrl} alt="" style={{ position: 'absolute', top: 855, left: 630, width: 340, height: 340, borderRadius: 170, objectFit: 'cover', border: '12px solid #ffffff', boxSizing: 'border-box' }} /> : null}
      <div style={{ position: 'absolute', top: 1062, left: 110, width: 380, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', fontFamily: FONT_SCRIPT, fontSize: 46, lineHeight: 1.15, color: PAPER, textAlign: 'center' }}>{p.realtor.name}</div>
        {p.realtor.logoUrl ? <img src={p.realtor.logoUrl} alt="" style={{ width: 140, height: 52, objectFit: 'contain', marginTop: 18 }} /> : null}
        {p.realtor.companyName ? (
          <div style={{ display: 'flex', fontFamily: FONT_SERIF, fontWeight: 400, fontSize: 30, color: PAPER, marginTop: 10, textAlign: 'center' }}>{p.realtor.companyName}</div>
        ) : null}
      </div>
      <div style={{ position: 'absolute', top: 1150, left: 550, display: 'flex', flexDirection: 'column' }}>{dotGrid(4, 5, 20, 5, PAPER)}</div>
    </div>
  );
}

function TSold3(p: SocialPostRenderProps) {
  const navy = '#11243E';
  const beige = '#D7BDA6';
  const cream = '#FFF9F3';
  const hero = p.images[0];
  const topBeige = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 158" width="700" height="158"><path d="M0 0 H520 L700 158 H0 Z" fill="${beige}"/></svg>`
  )}`;
  const bottomBeige = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 96" width="620" height="96"><path d="M0 0 H470 Q555 0 595 55 L620 96 H0 Z" fill="${beige}"/></svg>`
  )}`;
  const fade = `linear-gradient(to bottom, rgba(255,255,255,0) 40%, rgba(255,249,243,0) 40%, ${cream} 86%)`;
  return (
    <div style={{ ...ROOT, background: cream }}>
      <Cover src={hero} style={{ position: 'absolute', top: 158, left: 0, width: 1080, height: 640 }} />
      <div style={{ position: 'absolute', top: 695, left: 0, width: 1080, height: 103, backgroundImage: fade, display: 'flex' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 158, background: navy, display: 'flex' }} />
      <img src={topBeige} alt="" style={{ position: 'absolute', top: 0, left: 0, width: 700, height: 158 }} />
      <div style={{ position: 'absolute', top: 1120, left: 0, width: 1080, height: 230, background: navy, display: 'flex' }} />
      <img src={bottomBeige} alt="" style={{ position: 'absolute', top: 1024, left: 0, width: 620, height: 96 }} />
      {p.realtor.logoUrl ? <img src={p.realtor.logoUrl} alt="" style={{ position: 'absolute', top: 18, left: 44, width: 190, maxHeight: 76, objectFit: 'contain', objectPosition: 'left top' }} /> : null}
      {p.realtor.companyName ? (
        <div style={{ position: 'absolute', top: 104, left: 44, display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 22, color: navy, letterSpacing: 0.5 }}>{p.realtor.companyName}</div>
      ) : null}
      <div style={{ position: 'absolute', top: 42, right: 46, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <div style={{ display: 'flex', fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 62, color: beige, letterSpacing: 1, lineHeight: 1 }}>{(p.label || 'JUST').split(/\s+/)[0] || 'JUST'}</div>
        <div style={{ display: 'flex', fontFamily: FONT_SCRIPT, fontSize: 78, color: PAPER, marginLeft: 16, lineHeight: 1, marginTop: -6 }}>{(p.label || 'JUST Sold').split(/\s+/).slice(1).join(' ') || 'Sold'}</div>
      </div>
      <div style={{ position: 'absolute', top: 800, left: 44, display: 'flex', fontFamily: FONT_SERIF, fontWeight: 800, fontSize: 62, color: navy, lineHeight: 1, letterSpacing: 0.2 }}>THINKING OF SELLING</div>
      <div style={{ position: 'absolute', top: 866, left: 44, display: 'flex', flexDirection: 'row', alignItems: 'baseline' }}>
        <div style={{ display: 'flex', fontFamily: FONT_SERIF, fontWeight: 800, fontSize: 62, color: navy, lineHeight: 1 }}>YOUR</div>
        <div style={{ display: 'flex', fontFamily: FONT_SCRIPT, fontSize: 82, color: navy, marginLeft: 16, lineHeight: 1 }}>Home?</div>
      </div>
      <div style={{ position: 'absolute', top: 952, left: 44, width: 560, display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 26, color: navy, lineHeight: 1.35 }}>Let our expert agent guide you every step of the way.</div>
      <div style={{ position: 'absolute', top: 1055, left: 44, width: 460, height: 34, display: 'flex', alignItems: 'center', fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 28, color: navy, letterSpacing: 0.6 }}>{p.realtor.name}</div>
      {p.realtor.headshotUrl ? <img src={p.realtor.headshotUrl} alt="" style={{ position: 'absolute', top: 880, left: 672, width: 330, height: 330, borderRadius: 165, objectFit: 'cover', border: '6px solid #ffffff', boxSizing: 'border-box' }} /> : null}
      {p.realtor.phone ? (
        <div style={{ position: 'absolute', top: 1201, left: 56, width: 360, height: 68, display: 'flex', flexDirection: 'row', alignItems: 'center', border: `1.6px solid ${beige}`, borderRadius: 10, boxSizing: 'border-box', overflow: 'hidden' }}>
          <div style={{ display: 'flex', width: 64, height: 68, background: beige, alignItems: 'center', justifyContent: 'center' }}>
            <img src={phoneIcon(navy)} alt="" style={{ width: 30, height: 30 }} />
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 30, color: beige }}>{p.realtor.phone}</div>
        </div>
      ) : null}
    </div>
  );
}

function TSold4(p: SocialPostRenderProps) {
  const gold = '#D4A928';
  const ink = '#111111';
  const hero = p.images[0];
  const c1 = p.images[1] || hero;
  const c2 = p.images[2] || p.images[1] || hero;
  const c3 = p.images[3] || p.images[2] || p.images[1] || hero;
  const words = (p.label || 'Just SOLD').trim().split(/\s+/);
  const scriptWord = words[0] || 'Just';
  const boldWord = (words.slice(1).join(' ') || 'SOLD').toUpperCase();
  const cityLine = [p.property.city, [p.property.province, p.property.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const addressLine = p.property.address
    ? p.property.city && p.property.address.toLowerCase().includes(p.property.city.toLowerCase())
      ? p.property.address
      : [p.property.address, cityLine].filter(Boolean).join(', ')
    : '';
  const ribbon = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 80" width="860" height="80"><path d="M0 0 H860 L826 40 L860 80 H0 L34 40 Z" fill="${gold}"/></svg>`
  )}`;
  const bullet = (text: string, isLast = false) => (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: isLast ? 0 : 40 }}>
      <div style={{ display: 'flex', width: 12, height: 12, borderRadius: 6, background: ink, marginRight: 14 }} />
      <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 600, fontSize: 32, color: ink, lineHeight: 1 }}>{text}</div>
    </div>
  );
  return (
    <div style={{ ...ROOT, background: PAPER }}>
      {p.realtor.logoUrl ? <img src={p.realtor.logoUrl} alt="" style={{ position: 'absolute', top: 60, left: 110, width: 200, maxHeight: 82, objectFit: 'contain', objectPosition: 'left top' }} /> : null}
      {p.realtor.companyName ? (
        <div style={{ position: 'absolute', top: 146, left: 110, display: 'flex', fontFamily: FONT_SANS, fontWeight: 600, fontSize: 22, color: ink, letterSpacing: 1 }}>{p.realtor.companyName}</div>
      ) : null}
      <div style={{ position: 'absolute', top: 46, left: 452, display: 'flex', fontFamily: FONT_SCRIPT, fontSize: 104, lineHeight: 1, color: ink }}>{scriptWord}</div>
      <div style={{ position: 'absolute', top: 120, left: 664, display: 'flex', fontFamily: FONT_SANS, fontWeight: 900, fontSize: 108, lineHeight: 1, color: ink, letterSpacing: 0.5 }}>{boldWord}</div>
      <Cover src={hero} style={{ position: 'absolute', top: 232, left: 110, width: 860, height: 432 }} />
      <Cover src={c1} style={{ position: 'absolute', top: 682, left: 110, width: 277, height: 210 }} />
      <Cover src={c2} style={{ position: 'absolute', top: 655, left: 402, width: 277, height: 237, border: '10px solid #ffffff', boxSizing: 'border-box' }} />
      <Cover src={c3} style={{ position: 'absolute', top: 682, left: 694, width: 277, height: 210 }} />
      <img src={ribbon} alt="" style={{ position: 'absolute', top: 918, left: 110, width: 860, height: 80 }} />
      {addressLine ? (
        <div style={{ position: 'absolute', top: 918, left: 160, width: 760, height: 80, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <img src={pinIcon(PAPER)} alt="" style={{ width: 34, height: 34, marginRight: 12 }} />
          <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 34, color: PAPER, whiteSpace: 'nowrap' }}>{addressLine}</div>
        </div>
      ) : null}
      <div style={{ position: 'absolute', top: 1048, left: 110, display: 'flex', flexDirection: 'column' }}>
        {p.property.bedrooms ? bullet(`${fmtNum(p.property.bedrooms)} bedrooms`) : null}
        {p.property.bathrooms ? bullet(`${fmtNum(p.property.bathrooms)} bathrooms`) : null}
        {p.property.sqft ? bullet(`${fmtNum(p.property.sqft)} Sq. Ft.`, true) : null}
      </div>
      <div style={{ position: 'absolute', top: 1035, left: 362, width: 2, height: 220, background: '#333333', display: 'flex' }} />
      <div style={{ position: 'absolute', top: 1048, left: 420, width: 280, display: 'flex', flexDirection: 'column', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 38, color: ink, lineHeight: 1.28 }}>{p.realtor.name}</div>
      {p.realtor.phone ? (
        <div style={{ position: 'absolute', top: 1196, left: 420, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <div style={{ display: 'flex', width: 46, height: 46, borderRadius: 23, border: `3px solid ${ink}`, alignItems: 'center', justifyContent: 'center' }}>
            <img src={phoneIcon(ink)} alt="" style={{ width: 26, height: 26 }} />
          </div>
          <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 600, fontSize: 32, color: ink, marginLeft: 14 }}>{p.realtor.phone}</div>
        </div>
      ) : null}
      {p.realtor.headshotUrl ? <img src={p.realtor.headshotUrl} alt="" style={{ position: 'absolute', top: 1018, left: 745, width: 225, height: 225, borderRadius: 113, objectFit: 'cover' }} /> : null}
    </div>
  );
}

function TShowcase(p: SocialPostRenderProps) {
  return (
    <div style={ROOT}>
      <Cover src={p.images[0]} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <Overlay from="rgba(0,0,0,0.8)" via="rgba(0,0,0,0.05) 40%" to="rgba(0,0,0,0.2)" style={{ inset: 0 }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 64, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ fontFamily: FONT_SERIF, fontWeight: 800, fontSize: 76, color: PAPER, lineHeight: 1.05, wordBreak: 'break-word', textShadow: '0 4px 24px rgba(0,0,0,0.6)' }}>
            {p.property.address}
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginTop: 8, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
            {[p.property.city, p.property.province].filter(Boolean).join(', ')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 26 }}>
            <StatsRow property={p.property} dark />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 30, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.3)' }}>
            <AgentBar realtor={p.realtor} dark />
          </div>
        </div>
      </div>
    </div>
  );
}

function TAgentBrandCard(p: SocialPostRenderProps) {
  const hasHeadshot = !!p.realtor.headshotUrl;
  return (
    <div style={ROOT}>
      <Page style={{ paddingTop: 44 }}>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <Cover src={p.images[0]} style={{ width: 472, height: 560, borderRadius: 18, marginRight: 16 }} />
          <Cover src={p.images[1] || p.images[0]} style={{ width: 472, height: 560, borderRadius: 18 }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {p.realtor.logoUrl ? <img src={p.realtor.logoUrl} alt="" style={{ maxWidth: 300, maxHeight: 120, objectFit: 'contain', marginBottom: 16 }} /> : null}
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 56, letterSpacing: 4, color: BRAND }}>{p.label || "LET'S CONNECT"}</div>
          {hasHeadshot ? (
            <img
              src={p.realtor.headshotUrl!}
              alt=""
              style={{ width: 176, height: 176, borderRadius: 88, objectFit: 'cover', marginTop: 20, border: `6px solid ${BRAND}` }}
            />
          ) : null}
          <div style={{ fontFamily: FONT_SERIF, fontWeight: 800, fontSize: 56, color: INK, marginTop: 18 }}>{p.realtor.name}</div>
          {p.realtor.companyName ? (
            <div style={{ fontSize: 26, fontWeight: 600, color: MUTED, marginTop: 4 }}>{p.realtor.companyName}</div>
          ) : null}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
            <img src={phoneIcon(BRAND)} alt="" style={{ width: 28, height: 28, marginRight: 10 }} />
            <div style={{ fontSize: 30, fontWeight: 800, color: INK }}>{p.realtor.phone || ''}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20 }}>
            <StatsRow property={p.property} />
          </div>
        </div>
      </Page>
    </div>
  );
}

function TNewListing4(p: SocialPostRenderProps) {
  const teal = '#8FB8C4';
  const photo = p.images[0];
  const collageImages = [p.images[1] || photo, p.images[2] || p.images[1] || photo, p.images[3] || p.images[2] || p.images[1] || photo];
  const displayAddress = p.property.address || '';

  return (
    <div style={{ ...ROOT, background: '#F3F0EA' }}>
      <div style={{ position: 'absolute', top: 48, left: 45, width: 430, display: 'flex', fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 202, lineHeight: 0.9, color: teal, letterSpacing: 0 }}>NEW</div>
      <Cover src={collageImages[0]} style={{ position: 'absolute', top: 44, left: 445, width: 190, height: 200, borderRadius: 14 }} />
      <Cover src={collageImages[1]} style={{ position: 'absolute', top: 44, left: 650, width: 190, height: 200, borderRadius: 14 }} />
      <Cover src={collageImages[2]} style={{ position: 'absolute', top: 44, left: 845, width: 190, height: 200, borderRadius: 14 }} />
      <Cover src={photo} style={{ position: 'absolute', top: 280, left: 45, width: 990, height: 790, borderRadius: 16 }} />
      {p.realtor.logoUrl ? (
        <img src={p.realtor.logoUrl} alt="" style={{ position: 'absolute', top: 320, right: 55, width: 265, maxHeight: 110, objectFit: 'contain' }} />
      ) : null}
      {displayAddress ? (
        <div style={{ position: 'absolute', top: 1015, left: 74, width: 940, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', background: teal, borderRadius: 12 }}>
          <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 26, color: PAPER, letterSpacing: 5, textAlign: 'center' }}>{displayAddress.toUpperCase()}</div>
        </div>
      ) : null}
      <div style={{ position: 'absolute', top: 1092, left: 475, width: 560, display: 'flex', justifyContent: 'flex-end', fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 202, lineHeight: 0.9, color: teal, letterSpacing: 0, textAlign: 'right' }}>LISTING</div>
      {p.realtor.headshotUrl ? (
        <img src={p.realtor.headshotUrl} alt="" style={{ position: 'absolute', top: 1116, left: 45, width: 104, height: 104, borderRadius: 52, objectFit: 'cover' }} />
      ) : null}
      {p.realtor.phone ? (
        <div style={{ position: 'absolute', top: 1140, left: 185, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <img src={phoneIcon('#111111')} alt="" style={{ width: 52, height: 52 }} />
          <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 34, color: '#111111', marginLeft: 18 }}>{p.realtor.phone}</div>
        </div>
      ) : null}
      <div style={{ position: 'absolute', top: 1246, left: 46, display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 32, color: '#111111' }}>{p.realtor.name}</div>
      {p.realtor.companyName ? <div style={{ position: 'absolute', top: 1291, left: 46, display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 25, color: '#111111' }}>{p.realtor.companyName}</div> : null}
    </div>
  );
}

function TNewListing3(p: SocialPostRenderProps) {
  const teal = '#0E7464';
  const cream = '#FFF3C8';
  const footerGreen = '#25A978';
  const photo = p.images[0];
  const collageImages = [p.images[1] || photo, p.images[2] || p.images[1] || photo, p.images[3] || p.images[2] || p.images[1] || photo];
  const statTag = (value: string, label: string) => (
    <div style={{ display: 'flex', width: 205, height: 56, background: teal, alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
      <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 25, color: PAPER }}>{value} {label}</div>
    </div>
  );

  return (
    <div style={{ ...ROOT, background: cream }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 770, background: teal, display: 'flex' }} />
      <Cover src={photo} style={{ position: 'absolute', top: 15, left: 15, width: 1050, height: 740 }} />
      <Cover src={collageImages[0]} style={{ position: 'absolute', top: 650, left: 64, width: 300, height: 235, border: `6px solid ${PAPER}` }} />
      <Cover src={collageImages[1]} style={{ position: 'absolute', top: 615, left: 360, width: 360, height: 294, border: `6px solid ${PAPER}` }} />
      <Cover src={collageImages[2]} style={{ position: 'absolute', top: 650, left: 716, width: 300, height: 235, border: `6px solid ${PAPER}` }} />
      <div style={{ position: 'absolute', top: 922, left: 0, width: 1080, height: 205, background: cream, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {p.property.address ? (
          <div style={{ display: 'flex', maxWidth: 952, background: teal, borderRadius: 2, padding: '6px 22px', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 20, color: PAPER, textAlign: 'center', marginBottom: 12 }}>
            {(() => { const a = p.property.city && p.property.address && !p.property.address.toLowerCase().includes(p.property.city.toLowerCase()) ? `${p.property.address}, ${p.property.city}` : p.property.address; return a.length > 58 ? a.slice(0, 58) + '…' : a; })()}
          </div>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 760 }}>
          {p.property.bedrooms ? statTag(fmtNum(p.property.bedrooms), 'Beds') : null}
          {p.property.bathrooms ? statTag(fmtNum(p.property.bathrooms), 'Baths') : null}
          {p.property.sqft ? statTag(fmtNum(p.property.sqft), 'Sq Ft') : null}
        </div>
        <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 92, letterSpacing: 1, color: teal, marginTop: p.property.address ? 8 : 28, lineHeight: 1 }}>NEW LISTING</div>
      </div>
      <div style={{ position: 'absolute', top: 1127, left: 0, width: 430, height: 223, background: teal, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {p.realtor.logoUrl ? <img src={p.realtor.logoUrl} alt="" style={{ width: 190, maxHeight: 78, objectFit: 'contain', marginTop: 24 }} /> : null}
        {p.realtor.companyName ? <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 29, color: PAPER, marginTop: 14, textAlign: 'center' }}>{p.realtor.companyName}</div> : null}
      </div>
      <div style={{ position: 'absolute', top: 1127, left: 430, width: 650, height: 223, background: footerGreen, display: 'flex', flexDirection: 'row' }}>
        {p.realtor.headshotUrl ? <img src={p.realtor.headshotUrl} alt="" style={{ position: 'absolute', top: 30, left: 64, width: 166, height: 156, objectFit: 'cover', border: `5px solid ${PAPER}`, borderRadius: 2 }} /> : null}
        <div style={{ position: 'absolute', top: 80, left: 260, width: 350, height: 72, display: 'flex', flexDirection: 'row', alignItems: 'center', background: cream, borderRadius: 40, padding: '0 18px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', width: 48, height: 48, borderRadius: 24, background: teal, alignItems: 'center', justifyContent: 'center' }}>
            <img src={phoneIcon(PAPER)} alt="" style={{ width: 30, height: 30 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
            <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 20, color: '#111111' }}>{p.realtor.name}</div>
            {p.realtor.phone ? <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 22, color: teal }}>{p.realtor.phone}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function TNewListing2(p: SocialPostRenderProps) {
  const dark = '#514643';
  const tan = '#B78361';
  const photoOne = p.images[0];
  const photoTwo = p.images[1] || photoOne;
  const displayAddress = p.property.address || '';
  const statBlock = (icon: string, value: string, label: string, isLast = false) => (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', marginBottom: isLast ? 0 : 34 }}>
      <img src={icon} alt="" style={{ width: 48, height: 48 }} />
      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 18 }}>
        <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 31, color: dark, lineHeight: 1 }}>{value}</div>
        <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 22, color: dark, marginTop: 9 }}>{label}</div>
      </div>
    </div>
  );

  return (
    <div style={{ ...ROOT, background: PAPER }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 606, background: PAPER, display: 'flex', flexDirection: 'column' }}>
        {p.realtor.logoUrl ? <img src={p.realtor.logoUrl} alt="" style={{ position: 'absolute', top: 38, left: 90, width: 230, maxHeight: 72, objectFit: 'contain', objectPosition: 'left center' }} /> : null}
        {p.realtor.companyName ? <div style={{ position: 'absolute', top: 112, left: 92, display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 24, color: '#111111' }}>{p.realtor.companyName}</div> : null}
        <div style={{ position: 'absolute', top: 175, left: 96, display: 'flex', fontFamily: FONT_SCRIPT, fontSize: 145, lineHeight: 0.95, color: tan }}>New</div>
        <div style={{ position: 'absolute', top: 330, left: 95, display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 92, lineHeight: 0.95, letterSpacing: 1, color: dark }}>LISTING</div>
        <div style={{ position: 'absolute', top: 155, right: 100, width: 220, display: 'flex', flexDirection: 'column' }}>
          {p.property.bedrooms ? statBlock(bedIcon(dark), fmtNum(p.property.bedrooms), 'Bedrooms') : null}
          {p.property.bathrooms ? statBlock(bathIcon(dark), fmtNum(p.property.bathrooms), 'Bathrooms') : null}
          {p.property.sqft ? statBlock(sqftIcon(dark), fmtNum(p.property.sqft), 'Sq Ft', true) : null}
        </div>
        {displayAddress ? (
          <div style={{ position: 'absolute', top: 494, left: 115, width: 478, height: 66, display: 'flex', alignItems: 'center', paddingLeft: 48, border: `2px solid ${tan}`, borderRadius: 9, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 27, color: dark }}>{displayAddress}</div>
          </div>
        ) : null}
        <div style={{ position: 'absolute', top: 494, left: 91, width: 58, height: 58, borderRadius: 29, background: tan, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={pinIcon(PAPER)} alt="" style={{ width: 32, height: 32 }} />
        </div>
      </div>
      <div style={{ position: 'absolute', top: 606, left: 0, width: 1080, height: 444, display: 'flex', flexDirection: 'row', background: PAPER }}>
        <Cover src={photoOne} style={{ width: 533, height: 444 }} />
        <div style={{ display: 'flex', width: 14, height: 444, background: PAPER }} />
        <Cover src={photoTwo} style={{ width: 533, height: 444 }} />
      </div>
      <div style={{ position: 'absolute', top: 1050, left: 0, width: 1080, height: 300, background: dark, display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'absolute', top: 112, left: 92, width: 590, maxWidth: 590, display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 56, lineHeight: 1.08, color: PAPER }}>{p.realtor.name}</div>
        {p.realtor.phone ? (
          <div style={{ position: 'absolute', top: 244, left: 92, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <div style={{ display: 'flex', width: 54, height: 54, borderRadius: 27, background: tan, alignItems: 'center', justifyContent: 'center' }}>
              <img src={phoneIcon(PAPER)} alt="" style={{ width: 34, height: 34 }} />
            </div>
            <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 31, color: PAPER, marginLeft: 18 }}>{p.realtor.phone}</div>
          </div>
        ) : null}
        {p.realtor.headshotUrl ? (
          <img src={p.realtor.headshotUrl} alt="" style={{ position: 'absolute', top: 68, right: 104, width: 220, height: 220, objectFit: 'cover', border: `6px solid ${PAPER}`, borderRadius: 12 }} />
        ) : null}
      </div>
    </div>
  );
}

function TNewListing1(p: SocialPostRenderProps) {
  const hero = p.images[0];
  const collageImages = [
    p.images[1] || hero,
    p.images[2] || p.images[1] || hero,
    p.images[3] || p.images[2] || p.images[1] || hero,
  ];

  return (
    <div style={ROOT}>
      <Cover src={hero} style={{ width: '100%', height: 560 }} />
      {p.realtor.logoUrl ? (
        <img
          src={p.realtor.logoUrl}
          alt=""
          style={{
            position: 'absolute',
            top: 40,
            right: 40,
            height: 64,
            maxWidth: 220,
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))',
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          top: 480,
          left: 60,
          right: 60,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          background: DARK,
          borderRadius: 999,
          padding: '20px 36px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 30, color: PAPER, letterSpacing: 1, textAlign: 'center' }}>
            {(p.property.address || '').toUpperCase()}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <Cover src={collageImages[0]} style={{ width: 360, height: 260 }} />
        <Cover src={collageImages[1]} style={{ width: 360, height: 260 }} />
        <Cover src={collageImages[2]} style={{ width: 360, height: 260 }} />
      </div>
      <div style={{ width: '100%', height: 530, background: NL1_BAND, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
          <div style={{ width: 90, height: 3, background: PAPER, marginRight: 18 }} />
          <div style={{ display: 'flex', fontFamily: FONT_DISPLAY, fontSize: 130, lineHeight: 1, color: PAPER, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' }}>
            {p.label || 'New Listing'}
          </div>
          <div style={{ width: 90, height: 3, background: PAPER, marginLeft: 18 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0 64px 40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: PAPER, marginRight: 16 }} />
              <div style={{ display: 'flex', fontFamily: FONT_DISPLAY, fontSize: 42, color: PAPER, letterSpacing: 1 }}>
                {fmtNum(p.property.bedrooms)} BEDS
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: PAPER, marginRight: 16 }} />
              <div style={{ display: 'flex', fontFamily: FONT_DISPLAY, fontSize: 42, color: PAPER, letterSpacing: 1 }}>
                {fmtNum(p.property.bathrooms)} BATHS
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: PAPER, marginRight: 16 }} />
              <div style={{ display: 'flex', fontFamily: FONT_DISPLAY, fontSize: 42, color: PAPER, letterSpacing: 1 }}>
                {fmtNum(p.property.sqft)} SQ FT
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', width: 1, height: 240, background: 'rgba(255,255,255,0.6)', margin: '0 32px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'flex-end' }}>
            {p.realtor.headshotUrl ? (
              <img
                src={p.realtor.headshotUrl}
                alt=""
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: 65,
                  objectFit: 'cover',
                  border: `4px solid ${PAPER}`,
                  marginBottom: 14,
                }}
              />
            ) : null}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: 320 }}>
              {p.realtor.phone ? (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <img src={phoneIcon(PAPER)} alt="" style={{ width: 24, height: 24, marginRight: 8 }} />
                  <div style={{ display: 'flex', fontSize: 22, fontWeight: 800, color: PAPER }}>{p.realtor.phone}</div>
                </div>
              ) : null}
              <div
                style={{
                  display: 'flex',
                  fontSize: 30,
                  fontWeight: 800,
                  color: PAPER,
                  textAlign: 'right',
                  maxWidth: 320,
                  lineHeight: 1.1,
                }}
              >
                {p.realtor.name}
              </div>
            </div>
            {p.realtor.companyName ? (
              <div style={{ display: 'flex', fontSize: 22, fontWeight: 600, color: PAPER, marginTop: 10, textAlign: 'right', maxWidth: 320 }}>{p.realtor.companyName}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function TJustListed1(p: SocialPostRenderProps) {
  const photo = p.images[0];
  return (
    <div style={ROOT}>
      <Cover src={photo} style={{ position: 'absolute', top: 320, left: 0, width: '100%', height: 730 }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 40px 0' }}>
        {p.realtor.logoUrl ? (
          <img
            src={p.realtor.logoUrl}
            alt=""
            style={{ width: 160, maxHeight: 80, objectFit: 'contain', marginBottom: 8 }}
          />
        ) : null}
        <div
          style={{
            display: 'flex',
            fontFamily: FONT_SCRIPT,
            fontSize: 190,
            lineHeight: 0.9,
            color: INK,
            textAlign: 'center',
            fontStyle: 'normal',
          }}
        >
          {p.label || 'Just Listed'}
        </div>
        {p.property.address ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              background: DARK,
              borderRadius: 999,
              padding: '12px 32px',
              marginTop: 16,
            }}
          >
            <img src={pinIcon(PAPER)} alt="" style={{ width: 22, height: 22, marginRight: 10 }} />
            <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 18, color: PAPER, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {p.property.address.toUpperCase()}
            </div>
          </div>
        ) : null}
      </div>
      {p.realtor.headshotUrl ? (
        <img
          src={p.realtor.headshotUrl}
          alt=""
          style={{
            position: 'absolute',
            top: 920,
            left: '50%',
            marginLeft: -110,
            width: 220,
            height: 220,
            borderRadius: 110,
            objectFit: 'cover',
            border: `8px solid ${PAPER}`,
          }}
        />
      ) : null}
      <div style={{ position: 'absolute', top: 1110, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', padding: '60px 60px 40px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 24, color: INK, textTransform: 'uppercase', letterSpacing: 1, maxWidth: 360, lineHeight: 1.15 }}>
            {p.realtor.name}
          </div>
          <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 24, color: INK, textAlign: 'right' }}>
            {p.realtor.phone || ''}
          </div>
        </div>
        <div style={{ display: 'flex', height: 1, background: INK, marginTop: 30, marginBottom: 30, width: '100%' }} />
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 600, fontSize: 22, color: INK, textTransform: 'uppercase', letterSpacing: 1 }}>
              {p.property.bedrooms ? `${p.property.bedrooms} BEDROOM` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 600, fontSize: 22, color: INK, textTransform: 'uppercase', letterSpacing: 1 }}>
              {p.property.bathrooms ? `${p.property.bathrooms} BATHROOM` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 600, fontSize: 22, color: INK, textTransform: 'uppercase', letterSpacing: 1 }}>
              {p.property.sqft ? `${fmtNum(p.property.sqft)} SQ FT` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TJustListed2(p: SocialPostRenderProps) {
  const photo = p.images[0];
  const band = 'rgba(96, 112, 106, 0.9)';
  const statRow = (icon: string, text: string, isLast = false) => (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: isLast ? 0 : 18 }}>
      <img src={icon} alt="" style={{ width: 36, height: 36, marginRight: 16 }} />
      <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 36, color: PAPER, letterSpacing: 1.5, textTransform: 'uppercase' }}>{text}</div>
    </div>
  );
  return (
    <div style={ROOT}>
      <Cover src={photo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 90,
          width: 610,
          background: band,
          display: 'flex',
          flexDirection: 'column',
          padding: '110px 60px 56px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontFamily: FONT_SANS,
              fontWeight: 400,
              fontSize: 92,
              letterSpacing: 4,
              color: PAPER,
              textTransform: 'uppercase',
              lineHeight: 1.05,
            }}
          >
            {p.label || 'Just Listed'}
          </div>
          <div style={{ height: 2, background: PAPER, marginTop: 30 }} />
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 36 }}>
            {p.property.bedrooms ? statRow(bedIcon(PAPER), `${fmtNum(p.property.bedrooms)} Beds`) : null}
            {p.property.bathrooms ? statRow(bathIcon(PAPER), `${fmtNum(p.property.bathrooms)} Baths`) : null}
            {p.property.sqft ? statRow(sqftIcon(PAPER), `${fmtNum(p.property.sqft)} Sq Ft`, true) : null}
          </div>
          <div style={{ height: 2, background: PAPER, marginTop: 36 }} />
          <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 28, color: PAPER, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 28, lineHeight: 1.3 }}>
            {(p.property.address || '').toUpperCase()}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {p.realtor.headshotUrl ? (
            <img
              src={p.realtor.headshotUrl}
              alt=""
              style={{ width: 200, height: 200, borderRadius: 100, objectFit: 'cover', border: `4px solid ${PAPER}`, marginBottom: 24 }}
            />
          ) : null}
          {p.realtor.phone ? (
            <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 32, color: PAPER }}>{p.realtor.phone}</div>
          ) : null}
          {p.realtor.name ? (
            <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 600, fontSize: 28, color: PAPER, marginTop: 10 }}>{p.realtor.name}</div>
          ) : null}
          {p.realtor.logoUrl ? (
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '12px 20px', marginTop: 16, alignSelf: 'flex-start' }}>
              <img src={p.realtor.logoUrl} alt="" style={{ maxWidth: 220, maxHeight: 72, objectFit: 'contain' }} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TJustListed3(p: SocialPostRenderProps) {
  const photo = p.images[0];
  const GOLD2 = '#E9CB8B';
  const stats = [
    p.property.bedrooms ? `${fmtNum(p.property.bedrooms)} Beds` : '',
    p.property.bathrooms ? `${fmtNum(p.property.bathrooms)} Baths` : '',
    p.property.sqft ? `${fmtNum(p.property.sqft)} Sq Ft` : '',
  ]
    .filter(Boolean)
    .join('   •   ');
  return (
    <div style={ROOT}>
      <Cover src={photo} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 640 }} />
      {p.realtor.logoUrl ? (
        <div
          style={{
            position: 'absolute',
            top: 36,
            left: 36,
            display: 'flex',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 12,
            padding: '10px 18px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
          }}
        >
          <img src={p.realtor.logoUrl} alt="" style={{ maxWidth: 200, maxHeight: 64, objectFit: 'contain' }} />
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          top: 640,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#000000',
          backgroundImage: 'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.10), rgba(0,0,0,0) 60%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '44px 64px 56px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', fontFamily: FONT_SCRIPT, fontSize: 108, lineHeight: 1, color: GOLD2 }}>{p.label || 'Just Listed!'}</div>
        {p.property.address ? (
          <div
            style={{
              display: 'flex',
              fontFamily: FONT_SANS,
              fontWeight: 600,
              fontSize: 30,
              color: PAPER,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginTop: 26,
              lineHeight: 1.3,
            }}
          >
            {p.property.address.toUpperCase()}
          </div>
        ) : null}
        {stats ? (
          <div
            style={{
              display: 'flex',
              fontFamily: FONT_SANS,
              fontWeight: 500,
              fontSize: 26,
              color: PAPER,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginTop: 16,
            }}
          >
            {stats}
          </div>
        ) : null}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {p.realtor.headshotUrl ? (
            <img src={p.realtor.headshotUrl} alt="" style={{ width: 330, height: 330, borderRadius: 12, objectFit: 'cover' }} />
          ) : null}
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 44 }}>
            <div style={{ display: 'flex', fontFamily: FONT_SCRIPT, fontSize: 84, lineHeight: 1.05, color: GOLD2, maxWidth: 560 }}>{p.realtor.name}</div>
            {p.realtor.companyName ? (
              <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 34, color: PAPER, marginTop: 18 }}>{p.realtor.companyName}</div>
            ) : null}
            {p.realtor.phone ? (
              <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 34, color: PAPER, marginTop: 10 }}>{p.realtor.phone}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function TJustListed4(p: SocialPostRenderProps) {
  const dark = '#4D403B';
  const cream = '#F8F7F5';
  const taupe = '#E7DFD7';
  const photo = p.images[0];
  const collageImages = [p.images[1] || photo, p.images[2] || p.images[1] || photo, p.images[3] || p.images[2] || p.images[1] || photo];
  const displayAddress = p.property.address || '';
  const statCard = (icon: string, value: string, label: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 120, height: 116, border: `2px solid ${dark}`, borderRadius: 20, background: 'rgba(255,255,255,0.44)' }}>
      <img src={icon} alt="" style={{ width: 42, height: 42, marginBottom: 7 }} />
      <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 500, fontSize: 19, color: dark }}>{value} {label}</div>
    </div>
  );

  return (
    <div style={{ ...ROOT, background: cream }}>
      <div style={{ position: 'absolute', top: 0, left: 508, width: 572, height: 1350, background: taupe, display: 'flex' }} />
      <div style={{ position: 'absolute', top: 56, left: 64, width: 520, display: 'flex', flexDirection: 'column' }}>
        {p.realtor.logoUrl ? <img src={p.realtor.logoUrl} alt="" style={{ width: 220, maxHeight: 72, objectFit: 'contain', objectPosition: 'left center', alignSelf: 'flex-start' }} /> : null}
        {p.realtor.companyName ? <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 25, color: '#080808', marginTop: 22 }}>{p.realtor.companyName}</div> : null}
        <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 72, color: dark, letterSpacing: 1, lineHeight: 1, marginTop: 28, whiteSpace: 'nowrap' }}>JUST LISTED</div>
      </div>
      <Cover src={photo} style={{ position: 'absolute', top: 350, left: 0, width: 740, height: 635, borderBottomLeftRadius: 78, objectFit: 'cover' }} />
      {displayAddress ? (
        <div style={{ position: 'absolute', top: 322, left: 25, width: 650, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', background: dark, borderRadius: 8 }}>
          <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 26, color: PAPER, textAlign: 'center' }}>{displayAddress}</div>
        </div>
      ) : null}
      <div style={{ position: 'absolute', top: 296, left: 710, width: 298, height: 733, display: 'flex', flexDirection: 'column', alignItems: 'center', background: dark, borderRadius: 26, padding: '18px 18px', boxSizing: 'border-box' }}>
        <Cover src={collageImages[0]} style={{ width: 260, height: 220, border: `6px solid ${PAPER}`, borderRadius: 18, marginBottom: 14 }} />
        <Cover src={collageImages[1]} style={{ width: 260, height: 220, border: `6px solid ${PAPER}`, borderRadius: 18, marginBottom: 14 }} />
        <Cover src={collageImages[2]} style={{ width: 260, height: 220, border: `6px solid ${PAPER}`, borderRadius: 18 }} />
      </div>
      <div style={{ position: 'absolute', top: 1110, left: 60, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        {p.property.bedrooms ? statCard(bedIcon(dark), fmtNum(p.property.bedrooms), 'Beds') : null}
        {p.property.bathrooms ? <div style={{ display: 'flex', marginLeft: 18 }}>{statCard(bathIcon(dark), fmtNum(p.property.bathrooms), 'Baths')}</div> : null}
        {p.property.sqft ? <div style={{ display: 'flex', marginLeft: 18 }}>{statCard(sqftIcon(dark), fmtNum(p.property.sqft), 'sqft')}</div> : null}
      </div>
      <div style={{ position: 'absolute', top: 1075, left: 545, width: 455, height: 230, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: 24 }}>
          <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 27, color: '#080808' }}>{p.realtor.name}</div>
          {p.realtor.phone ? <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 26, color: dark, marginTop: 50, paddingBottom: 12, borderBottom: `3px solid ${dark}` }}>{p.realtor.phone}</div> : null}
        </div>
        {p.realtor.headshotUrl ? <img src={p.realtor.headshotUrl} alt="" style={{ width: 220, height: 205, borderRadius: 20, objectFit: 'cover', border: `6px solid ${PAPER}`, marginLeft: 18 }} /> : null}
      </div>
    </div>
  );
}

function TComingSoon4(p: SocialPostRenderProps) {
  const photo = p.images[0];
  const red = '#CF1015';
  const displayAddress = p.property.address || '';
  const stat = (icon: string, label: string, value: string, withDivider: boolean) => (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', flex: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <img src={icon} alt="" style={{ width: 62, height: 62, marginBottom: 10 }} />
        <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 21, color: INK, textAlign: 'center' }}>{label}: {value}</div>
      </div>
      {withDivider ? <div style={{ display: 'flex', width: 2, background: red, margin: '8px 0' }} /> : null}
    </div>
  );

  return (
    <div style={{ ...ROOT, background: '#111111' }}>
      <Cover src={photo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', background: 'rgba(0,0,0,0.24)' }} />
      <div style={{ position: 'absolute', top: 80, left: 80, width: 920, height: 1050, display: 'flex', flexDirection: 'column', background: PAPER, borderRadius: 28, overflow: 'hidden' }}>
        <Cover src={photo} style={{ position: 'absolute', top: 16, left: 16, width: 888, height: 580 }} />
        <div style={{ position: 'absolute', top: 525, left: 16, width: 888, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontFamily: FONT_SCRIPT, fontSize: 142, lineHeight: 0.95, color: red, textAlign: 'center' }}>{p.label || 'Coming Soon'}</div>
        </div>
        {displayAddress ? (
          <div style={{ position: 'absolute', top: 735, left: 95, width: 730, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <img src={pinIcon(red)} alt="" style={{ width: 46, height: 46, marginRight: 18 }} />
            <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 31, color: INK, textAlign: 'center' }}>{displayAddress}</div>
          </div>
        ) : null}
        <div style={{ position: 'absolute', top: 825, left: 32, width: 856, height: 150, display: 'flex', flexDirection: 'row' }}>
          {p.property.bedrooms ? stat(bedIcon(red), 'Bedrooms', fmtNum(p.property.bedrooms), true) : null}
          {p.property.bathrooms ? stat(bathIcon(red), 'Bathrooms', fmtNum(p.property.bathrooms), true) : null}
          {p.property.sqft ? stat(sqftIcon(red), 'Sq Ft', fmtNum(p.property.sqft), false) : null}
        </div>
      </div>
      <div style={{ position: 'absolute', top: 1208, left: 0, right: 0, height: 142, background: red, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        {p.realtor.headshotUrl ? (
          <img src={p.realtor.headshotUrl} alt="" style={{ position: 'absolute', left: 42, top: -62, width: 178, height: 178, borderRadius: 89, objectFit: 'cover', border: `8px solid ${PAPER}` }} />
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 246 }}>
          <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 35, color: PAPER }}>{p.realtor.name}</div>
          {p.realtor.phone ? (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <img src={phoneIcon(PAPER)} alt="" style={{ width: 32, height: 32, marginRight: 12 }} />
              <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 26, color: PAPER }}>{p.realtor.phone}</div>
            </div>
          ) : null}
        </div>
        <div style={{ position: 'absolute', right: 56, top: 18, width: 230, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {p.realtor.logoUrl ? <img src={p.realtor.logoUrl} alt="" style={{ maxWidth: 210, maxHeight: 72, objectFit: 'contain' }} /> : null}
          {p.realtor.companyName ? <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 20, color: PAPER, marginTop: 8, textAlign: 'center' }}>{p.realtor.companyName}</div> : null}
        </div>
      </div>
    </div>
  );
}

function TForSale1(p: SocialPostRenderProps) {
  const navy = '#163B7A';
  const pale = '#EAF1FD';
  const gold = '#F0D347';
  const hero = p.images[0];
  const circleLeft = p.images[1] || hero;
  const circleCenter = p.images[2] || p.images[1] || hero;
  const circleRight = p.images[3] || p.images[2] || p.images[1] || hero;
  const displayAddress = p.property.address || '';
  const cityLine = p.property.city ? (displayAddress.toLowerCase().includes(p.property.city.toLowerCase()) ? displayAddress : `${displayAddress}, ${p.property.city}`) : displayAddress;
  return (
    <div style={{ ...ROOT, background: pale }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 312, background: pale, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {p.realtor.logoUrl ? <img src={p.realtor.logoUrl} alt="" style={{ position: 'absolute', top: 24, right: 36, width: 190, maxHeight: 66, objectFit: 'contain', objectPosition: 'right top' }} /> : null}
        {!p.realtor.logoUrl ? <div style={{ position: 'absolute', top: 34, right: 36, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}><div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 24, color: navy }}>{p.realtor.companyName || 'Agency Name'}</div></div> : null}
        {p.realtor.logoUrl && p.realtor.companyName ? <div style={{ position: 'absolute', top: 92, right: 36, display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 22, color: navy }}>{p.realtor.companyName}</div> : null}
        <div style={{ position: 'absolute', top: 92, left: 0, width: 1080, display: 'flex', justifyContent: 'center', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 90, letterSpacing: 2, color: navy, lineHeight: 1 }}>{(p.label || 'FOR SALE').toUpperCase()}</div>
        <div style={{ position: 'absolute', top: 206, left: 0, width: 1080, display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
          <div style={{ display: 'flex', width: 18, height: 18, borderRadius: 9, background: navy, marginRight: 14 }} />
          <div style={{ display: 'flex', width: 18, height: 18, borderRadius: 9, background: navy, marginRight: 14 }} />
          <div style={{ display: 'flex', width: 18, height: 18, borderRadius: 9, background: navy }} />
        </div>
        {cityLine ? <div style={{ position: 'absolute', top: 248, left: 0, width: 1080, display: 'flex', justifyContent: 'center', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 23, color: navy, textAlign: 'center' }}>{cityLine}</div> : null}
      </div>
      <Cover src={hero} style={{ position: 'absolute', top: 312, left: 0, width: 1080, height: 568 }} />
      <div style={{ position: 'absolute', top: 780, left: -90, width: 1260, height: 280, background: gold, borderTopLeftRadius: 630, borderTopRightRadius: 630, display: 'flex' }} />
      <div style={{ position: 'absolute', top: 786, left: -90, width: 1260, height: 280, background: navy, borderTopLeftRadius: 630, borderTopRightRadius: 630, display: 'flex' }} />
      <div style={{ position: 'absolute', top: 928, left: 0, width: 1080, height: 422, background: navy, display: 'flex' }} />
      <Cover src={circleLeft} style={{ position: 'absolute', top: 771, left: 78, width: 218, height: 218, borderRadius: 109, border: `6px solid ${PAPER}`, boxSizing: 'border-box' }} />
      <Cover src={circleCenter} style={{ position: 'absolute', top: 692, left: 360, width: 360, height: 360, borderRadius: 180, border: `6px solid ${PAPER}`, boxSizing: 'border-box' }} />
      <Cover src={circleRight} style={{ position: 'absolute', top: 771, left: 784, width: 218, height: 218, borderRadius: 109, border: `6px solid ${PAPER}`, boxSizing: 'border-box' }} />
      <div style={{ position: 'absolute', top: 1064, left: 145, width: 790, height: 148, border: '1.2px solid rgba(255,255,255,0.75)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          {p.property.bedrooms ? (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginRight: p.property.bathrooms ? 64 : 0 }}>
              <div style={{ display: 'flex', width: 8, height: 8, borderRadius: 4, background: PAPER, marginRight: 10 }} />
              <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 23, color: PAPER }}>{fmtNum(p.property.bedrooms)} Bedrooms</div>
            </div>
          ) : null}
          {p.property.bathrooms ? (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <div style={{ display: 'flex', width: 8, height: 8, borderRadius: 4, background: PAPER, marginRight: 10 }} />
              <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 23, color: PAPER }}>{fmtNum(p.property.bathrooms)} Bathrooms</div>
            </div>
          ) : null}
        </div>
        {p.property.sqft ? (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
            <div style={{ display: 'flex', width: 8, height: 8, borderRadius: 4, background: PAPER, marginRight: 10 }} />
            <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 23, color: PAPER }}>{fmtNum(p.property.sqft)} Sq Ft</div>
          </div>
        ) : null}
      </div>
      {p.realtor.headshotUrl ? <img src={p.realtor.headshotUrl} alt="" style={{ position: 'absolute', top: 1230, left: 482, width: 116, height: 116, borderRadius: 58, objectFit: 'cover', border: `3px solid ${PAPER}` }} /> : null}
      {p.realtor.phone ? <div style={{ position: 'absolute', top: 1274, left: 80, display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 23, color: PAPER }}>{p.realtor.phone}</div> : null}
      <div style={{ position: 'absolute', top: 1274, right: 80, display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 23, color: PAPER, textAlign: 'right', maxWidth: 320 }}>{p.realtor.name}</div>
    </div>
  );
}

function TForSale2(p: SocialPostRenderProps) {
  const dark = '#2F323A';
  const gold = '#F3A21A';
  const goldBorder = '#C8A02A';
  const cream = '#FFFBF0';
  const hero = p.images[0];
  const t1 = p.images[1] || hero;
  const t2 = p.images[2] || p.images[1] || hero;
  const t3 = p.images[3] || p.images[2] || p.images[1] || hero;
  const t4 = p.images[4] || p.images[3] || p.images[2] || p.images[1] || hero;
  const wavy = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 102" width="1080" height="102"><path d="M0 28 C 220 10 380 10 540 22 C 700 34 860 48 1080 28 L1080 36 C 860 56 700 42 540 30 C 380 18 220 18 0 36 Z" fill="${gold}"/><path d="M0 36 C 220 18 380 18 540 30 C 700 42 860 56 1080 36 L1080 102 L0 102 Z" fill="${dark}"/></svg>`
  )}`;
  const iconFallback = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="14" fill="#ffffff"/><path d="M12 56 L50 20 L88 56 L76 56 L50 31 L24 56 Z" fill="#8A735E"/><path d="M18 72 L50 42 L82 72 L70 72 L50 54 L30 72 Z" fill="#C8A02A"/><rect x="44" y="46" width="7" height="7" fill="#2B2E32"/><rect x="53" y="46" width="7" height="7" fill="#2B2E32"/><rect x="44" y="55" width="7" height="7" fill="#2B2E32"/><rect x="53" y="55" width="7" height="7" fill="#2B2E32"/></svg>`
  )}`;
  return (
    <div style={{ ...ROOT, background: cream }}>
      <Cover src={hero} style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 592 }} />
      <img src={wavy} alt="" style={{ position: 'absolute', top: 514, left: 0, width: 1080, height: 102 }} />
      <div style={{ position: 'absolute', top: 616, left: 0, width: 1080, height: 214, background: dark, display: 'flex' }} />
      {p.property.address ? (
        <div style={{ position: 'absolute', top: 622, left: 72, width: 608, display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 19, color: '#EDE8DA', lineHeight: 1.2 }}>
          {(() => { const a = p.property.city && !p.property.address.toLowerCase().includes(p.property.city.toLowerCase()) ? `${p.property.address}, ${p.property.city}` : p.property.address; return a.length > 46 ? a.slice(0, 46) + '…' : a; })()}
        </div>
      ) : null}
      <div style={{ position: 'absolute', top: p.property.address ? 652 : 652, left: 72, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 64, color: PAPER, letterSpacing: 0.5, lineHeight: 1 }}>{(p.label || 'PROPERTY').toUpperCase().split(' ').slice(0, 1).join(' ') || 'PROPERTY'}</div>
        <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 64, color: PAPER, letterSpacing: 0.5, lineHeight: 1, marginTop: 6 }}>{((p.label || 'PROPERTY FOR SALE').toUpperCase().split(' ').slice(1).join(' ') || 'FOR SALE')}</div>
      </div>
      <div style={{ position: 'absolute', top: 510, right: 76, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', width: 176, height: 176, borderRadius: 26, background: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 24px rgba(0,0,0,0.18)' }}>
          {p.realtor.logoUrl ? <img src={p.realtor.logoUrl} alt="" style={{ width: 140, height: 140, objectFit: 'contain' }} /> : <img src={iconFallback} alt="" style={{ width: 140, height: 140 }} />}
        </div>
        <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 22, color: PAPER, marginTop: 12, textAlign: 'center' }}>{p.realtor.companyName || 'Agency Name'}</div>
      </div>
      <div style={{ position: 'absolute', top: 830, left: 0, width: 1080, height: 398, background: cream, display: 'flex' }} />
      <Cover src={t1} style={{ position: 'absolute', top: 862, left: 72, width: 304, height: 172, border: `2px solid ${goldBorder}`, boxSizing: 'border-box' }} />
      <Cover src={t2} style={{ position: 'absolute', top: 862, left: 404, width: 304, height: 172, border: `2px solid ${goldBorder}`, boxSizing: 'border-box' }} />
      <Cover src={t3} style={{ position: 'absolute', top: 1056, left: 72, width: 304, height: 172, border: `2px solid ${goldBorder}`, boxSizing: 'border-box' }} />
      <Cover src={t4} style={{ position: 'absolute', top: 1056, left: 404, width: 304, height: 172, border: `2px solid ${goldBorder}`, boxSizing: 'border-box' }} />
      <div style={{ position: 'absolute', top: 872, left: 740, width: 270, display: 'flex', flexDirection: 'column' }}>
        {p.property.bedrooms ? <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 27, color: INK, lineHeight: 1 }}>{fmtNum(p.property.bedrooms)} Bedrooms</div> : null}
        {p.property.bathrooms ? <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 27, color: INK, lineHeight: 1, marginTop: 14 }}>{fmtNum(p.property.bathrooms)} Bathrooms</div> : null}
        {p.property.sqft ? <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 27, color: INK, lineHeight: 1, marginTop: 14 }}>{fmtNum(p.property.sqft)} Sq Ft</div> : null}
      </div>
      <div style={{ position: 'absolute', top: 1130, left: 740, display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 27, color: INK, maxWidth: 270 }}>{p.realtor.name}</div>
      <div style={{ position: 'absolute', top: 1228, left: 0, width: 1080, height: 122, background: dark, display: 'flex' }} />
      <div style={{ position: 'absolute', top: 1262, left: 248, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <div style={{ display: 'flex', width: 58, height: 58, borderRadius: 29, border: `1.8px solid ${goldBorder}`, alignItems: 'center', justifyContent: 'center' }}>
          <img src={phoneIcon(goldBorder)} alt="" style={{ width: 28, height: 28 }} />
        </div>
        {p.realtor.phone ? <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 44, color: goldBorder, marginLeft: 16, letterSpacing: 0.8 }}>{p.realtor.phone}</div> : null}
      </div>
      {p.realtor.headshotUrl ? <img src={p.realtor.headshotUrl} alt="" style={{ position: 'absolute', top: 1202, right: 72, width: 140, height: 138, objectFit: 'cover', border: `2px solid ${goldBorder}`, boxSizing: 'border-box' }} /> : null}
    </div>
  );
}

function TForSale3(p: SocialPostRenderProps) {
  const dark = '#2F3542';
  const bg = '#F1F0EB';
  const green = '#3DDC5B';
  const hero = p.images[0];
  const photo2 = p.images[1] || hero;
  const photo3 = p.images[2] || p.images[1] || hero;
  const labelWords = (p.label || 'For Sale').trim().split(/\s+/);
  const scriptWord = labelWords[0] || 'For';
  const restWords = (labelWords.slice(1).join(' ') || 'Sale').toUpperCase();
  const dotGrid = (cols: number, rows: number, gap: number, size: number, color: string) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {Array.from({ length: rows }, (_, y) => (
        <div key={y} style={{ display: 'flex', flexDirection: 'row', marginBottom: y < rows - 1 ? gap : 0 }}>
          {Array.from({ length: cols }, (_, x) => (
            <div key={x} style={{ display: 'flex', width: size, height: size, borderRadius: size / 2, background: color, marginRight: x < cols - 1 ? gap : 0 }} />
          ))}
        </div>
      ))}
    </div>
  );
  const wedge = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 918" width="150" height="918"><polygon points="0,459 150,0 150,918" fill="${dark}"/></svg>`
  )}`;
  const checkCircle = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="16" fill="${green}"/><path d="M9 16.5 l5 5 l9 -11" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  )}`;
  const featureRow = (text: string, isLast = false) => (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: isLast ? 0 : 24 }}>
      <img src={checkCircle} alt="" style={{ width: 34, height: 34 }} />
      <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 500, fontSize: 30, color: PAPER, marginLeft: 18 }}>{text}</div>
    </div>
  );
  return (
    <div style={{ ...ROOT, background: bg }}>
      <img src={wedge} alt="" style={{ position: 'absolute', top: 156, left: 0, width: 150, height: 918 }} />
      <div style={{ position: 'absolute', top: -100, right: -30, width: 220, height: 216, borderBottomLeftRadius: 100, background: dark, display: 'flex' }} />
      {p.realtor.logoUrl ? <img src={p.realtor.logoUrl} alt="" style={{ position: 'absolute', top: 24, left: 62, width: 160, maxHeight: 96, objectFit: 'contain', objectPosition: 'left top' }} /> : null}
      {p.realtor.companyName ? (
        <div style={{ position: 'absolute', top: 126, left: 62, display: 'flex', fontFamily: FONT_SANS, fontWeight: 500, fontSize: 20, color: dark, letterSpacing: 7, textTransform: 'uppercase' }}>{p.realtor.companyName}</div>
      ) : null}
      <div style={{ position: 'absolute', top: 72, left: 447, display: 'flex', flexDirection: 'column' }}>{dotGrid(6, 3, 24, 6, dark)}</div>
      <Cover src={hero} style={{ position: 'absolute', top: 158, left: 62, width: 552, height: 968, border: `6px solid ${dark}`, boxSizing: 'border-box' }} />
      <div style={{ position: 'absolute', top: 136, left: 638, display: 'flex', fontFamily: FONT_SCRIPT, fontSize: 92, lineHeight: 1, color: dark }}>{scriptWord}</div>
      <div style={{ position: 'absolute', top: 208, left: 640, display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 72, lineHeight: 1, color: dark, letterSpacing: 1 }}>{restWords}</div>
      <div style={{ position: 'absolute', top: 296, left: 638, width: 392, height: 316, background: dark, borderRadius: 30, display: 'flex', flexDirection: 'column', padding: '16px 0 0 18px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 35, color: PAPER }}>Home Features</div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 47 }}>
          {p.property.bedrooms ? featureRow(`${fmtNum(p.property.bedrooms)} Bedrooms`) : null}
          {p.property.bathrooms ? featureRow(`${fmtNum(p.property.bathrooms)} Bathrooms`) : null}
          {p.property.sqft ? featureRow(`${fmtNum(p.property.sqft)} Sq Ft`, true) : null}
        </div>
      </div>
      {p.property.address ? (
        <div style={{ position: 'absolute', top: 622, left: 638, display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 19, color: dark, width: 392, lineHeight: 1.3 }}>{(() => { const a=p.property.city && !p.property.address.toLowerCase().includes(p.property.city.toLowerCase()) ? `${p.property.address}, ${p.property.city}` : p.property.address; return a.length > 78 ? a.slice(0, 78) + '…':a;})()}</div>
      ) : null}
      <Cover src={photo2} style={{ position: 'absolute', top: 808, left: 426, width: 296, height: 262, border: `6px solid ${dark}`, boxSizing: 'border-box' }} />
      <Cover src={photo3} style={{ position: 'absolute', top: 808, left: 734, width: 296, height: 262, border: `6px solid ${dark}`, boxSizing: 'border-box' }} />
      {p.realtor.headshotUrl ? <img src={p.realtor.headshotUrl} alt="" style={{ position: 'absolute', top: 1108, left: 886, width: 144, height: 134, objectFit: 'cover', border: `6px solid ${dark}`, boxSizing: 'border-box' }} /> : null}
      <div style={{ position: 'absolute', top: 1268, left: 726, width: 304, display: 'flex', justifyContent: 'flex-end', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 21, color: dark, letterSpacing: 4, textAlign: 'right', textTransform: 'uppercase' }}>{p.realtor.name}</div>
      <div style={{ position: 'absolute', top: 1148, left: 75, display: 'flex', flexDirection: 'column' }}>{dotGrid(6, 3, 24, 6, dark)}</div>
      <div style={{ position: 'absolute', top: 1226, left: 75, width: 64, height: 64, borderRadius: 32, background: dark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={phoneIcon(PAPER)} alt="" style={{ width: 30, height: 30 }} />
      </div>
      {p.realtor.phone ? (
        <div style={{ position: 'absolute', top: 1226, left: 152, height: 64, display: 'flex', alignItems: 'center', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 44, color: dark }}>{p.realtor.phone}</div>
      ) : null}
    </div>
  );
}

function TForSale4(p: SocialPostRenderProps) {
  const ink = '#141414';
  const hero = p.images[0];
  const g1 = p.images[1] || hero;
  const g2 = p.images[2] || p.images[1] || hero;
  const g3 = p.images[3] || p.images[2] || p.images[1] || hero;
  const g4 = p.images[4] || p.images[3] || p.images[2] || p.images[1] || hero;
  const words = (p.label || 'Home for Sale').trim().split(/\s+/);
  const line1 = words[0] || 'Home';
  const line2 = words.slice(1).join(' ') || 'for Sale';
  const topMask = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 128" width="1080" height="128"><path d="M0 0 H1080 V68 Q 540 142 0 68 Z" fill="#ffffff"/></svg>`
  )}`;
  const bottomMask = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 112" width="1080" height="112"><path d="M0 18 Q 360 34 540 44 Q 780 56 1080 78 L1080 112 L0 112 Z" fill="#ffffff"/></svg>`
  )}`;
  const feature = (icon: string, text: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <img src={icon} alt="" style={{ width: 54, height: 54, marginBottom: 10 }} />
      <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 24, color: ink }}>{text}</div>
    </div>
  );
  return (
    <div style={{ ...ROOT, background: PAPER }}>
      <Cover src={hero} style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 640 }} />
      <img src={topMask} alt="" style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 128 }} />
      <img src={bottomMask} alt="" style={{ position: 'absolute', top: 538, left: 0, width: 1080, height: 112 }} />
      {p.realtor.logoUrl ? <img src={p.realtor.logoUrl} alt="" style={{ position: 'absolute', top: 16, left: 432, width: 216, height: 58, objectFit: 'contain' }} /> : null}
      {p.realtor.companyName ? (
        <div style={{ position: 'absolute', top: 78, left: 0, width: 1080, display: 'flex', justifyContent: 'center', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 24, color: '#2e2e2e' }}>{p.realtor.companyName}</div>
      ) : null}
      <div style={{ position: 'absolute', top: 648, left: 88, width: 400, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 104, lineHeight: 0.98, color: ink }}>{line1}</div>
        <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 800, fontSize: 104, lineHeight: 0.98, color: ink, marginTop: 8 }}>{line2}</div>
        {p.property.address ? (
          <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 19, color: '#5a5a5a', marginTop: 10, width: 400, lineHeight: 1.3 }}>
            {p.property.city && !p.property.address.toLowerCase().includes(p.property.city.toLowerCase()) ? `${p.property.address}, ${p.property.city}` : p.property.address}
          </div>
        ) : null}
      </div>
      <Cover src={g1} style={{ position: 'absolute', top: 522, left: 585, width: 215, height: 168 }} />
      <Cover src={g2} style={{ position: 'absolute', top: 522, left: 810, width: 215, height: 168 }} />
      <Cover src={g3} style={{ position: 'absolute', top: 695, left: 585, width: 215, height: 168 }} />
      <Cover src={g4} style={{ position: 'absolute', top: 695, left: 810, width: 215, height: 168 }} />
      <div style={{ position: 'absolute', top: 910, left: 0, width: 1080, display: 'flex', justifyContent: 'center', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 28, color: ink }}>Features</div>
      <div style={{ position: 'absolute', top: 946, left: 88, width: 904, height: 124, border: `2.5px solid ${ink}`, borderRadius: 62, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 64px', boxSizing: 'border-box' }}>
        {p.property.sqft ? feature(sqftIcon(ink), `${fmtNum(p.property.sqft)} Sq Ft`) : null}
        {p.property.bathrooms ? feature(bathIcon(ink), `${fmtNum(p.property.bathrooms)} baths`) : null}
        {p.property.bedrooms ? feature(bedIcon(ink), `${fmtNum(p.property.bedrooms)} Beds`) : null}
      </div>
      {p.realtor.headshotUrl ? <img src={p.realtor.headshotUrl} alt="" style={{ position: 'absolute', top: 1120, left: 96, width: 130, height: 130, objectFit: 'cover' }} /> : null}
      <div style={{ position: 'absolute', top: 1120, left: 250, width: 268, height: 130, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', width: 268, fontFamily: FONT_SANS, fontWeight: 400, fontSize: 28, lineHeight: 1.18, color: ink }}>{p.realtor.name}</div>
      </div>
      <div style={{ position: 'absolute', top: 1120, left: 540, width: 2, height: 130, background: ink, display: 'flex' }} />
      <div style={{ position: 'absolute', top: 1120, left: 562, width: 422, height: 130, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <img src={phoneIcon(ink)} alt="" style={{ width: 40, height: 40 }} />
        {p.realtor.phone ? <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 32, color: ink, marginLeft: 8 }}>{p.realtor.phone}</div> : null}
      </div>
    </div>
  );
}

function TComingSoon3(p: SocialPostRenderProps) {
  const navy = '#0D2038';
  const lightBlue = '#A9C9FF';
  const photo = p.images[0];
  const collageLeft = p.images[1] || photo;
  const collageCenter = p.images[2] || photo;
  const collageRight = p.images[3] || photo;
  const displayAddress = p.property.address && p.property.city && !p.property.address.toLowerCase().includes(p.property.city.toLowerCase())
    ? `${p.property.address}, ${p.property.city}`
    : p.property.address;
  const labelWords = (p.label || 'COMING SOON').toUpperCase().split(/\s+/);
  const firstHeadlineLine = labelWords[0] || 'COMING';
  const secondHeadlineLine = labelWords.slice(1).join(' ') || 'SOON';
  const statRow = (icon: string, text: string) => (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 34 }}>
      <img src={icon} alt="" style={{ width: 38, height: 38, marginRight: 22 }} />
      <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 28, color: PAPER }}>{text}</div>
    </div>
  );

  return (
    <div style={{ ...ROOT, background: navy }}>
      <div style={{ position: 'absolute', top: 0, left: 540, width: 540, height: 900, display: 'flex', flexDirection: 'column' }}>
        <Cover src={photo} style={{ width: 540, height: 900 }} />
      </div>
      <div style={{ position: 'absolute', top: 900, left: 540, width: 540, height: 450, background: lightBlue, display: 'flex', flexDirection: 'column' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: 540, height: 1350, background: navy, display: 'flex', flexDirection: 'column', padding: '42px 80px', boxSizing: 'border-box' }}>
        {p.realtor.logoUrl ? (
          <img src={p.realtor.logoUrl} alt="" style={{ width: 220, maxHeight: 90, objectFit: 'contain', alignSelf: 'flex-start', marginLeft: -10 }} />
        ) : null}
        {p.realtor.companyName ? (
          <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 24, color: PAPER, marginTop: 14, marginLeft: -10 }}>{p.realtor.companyName}</div>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 24, marginLeft: -10 }}>
          <div style={{ display: 'flex', fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 106, lineHeight: 0.98, color: PAPER, letterSpacing: 2 }}>{firstHeadlineLine}</div>
          <div style={{ display: 'flex', fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 106, lineHeight: 0.98, color: PAPER, letterSpacing: 2, marginTop: 38 }}>{secondHeadlineLine}</div>
        </div>
        {displayAddress ? (
          <div style={{ position: 'absolute', top: 515, left: 27, width: 495, height: 52, background: lightBlue, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 25, color: navy, textAlign: 'center' }}>{displayAddress.toUpperCase()}</div>
          </div>
        ) : null}
        <div style={{ position: 'absolute', left: 80, bottom: 72, display: 'flex', flexDirection: 'column' }}>
          {p.property.bedrooms ? statRow(bedIcon(PAPER), `${fmtNum(p.property.bedrooms)} beds`) : null}
          {p.property.bathrooms ? statRow(bathIcon(PAPER), `${fmtNum(p.property.bathrooms)} baths`) : null}
          {p.property.sqft ? statRow(sqftIcon(PAPER), `${fmtNum(p.property.sqft)} Sq Ft`) : null}
        </div>
      </div>
      <div style={{ position: 'absolute', top: 1035, left: 730, width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {p.realtor.headshotUrl ? (
          <img src={p.realtor.headshotUrl} alt="" style={{ width: 128, height: 128, borderRadius: 64, objectFit: 'cover', border: `4px solid ${PAPER}` }} />
        ) : null}
        <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 30, color: navy, marginTop: 22, textAlign: 'center' }}>{p.realtor.name}</div>
        {p.realtor.phone ? (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 26 }}>
            <div style={{ display: 'flex', width: 52, height: 52, borderRadius: 26, border: `3px solid ${navy}`, alignItems: 'center', justifyContent: 'center' }}>
              <img src={phoneIcon(navy)} alt="" style={{ width: 34, height: 34 }} />
            </div>
            <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 400, fontSize: 34, color: navy, marginLeft: 18 }}>{p.realtor.phone}</div>
          </div>
        ) : null}
      </div>
      <Cover src={collageLeft} style={{ position: 'absolute', top: 770, left: 80, width: 255, height: 225, border: `4px solid ${PAPER}` }} />
      <Cover src={collageCenter} style={{ position: 'absolute', top: 720, left: 360, width: 360, height: 320, border: `4px solid ${PAPER}` }} />
      <Cover src={collageRight} style={{ position: 'absolute', top: 770, left: 745, width: 255, height: 225, border: `4px solid ${PAPER}` }} />
    </div>
  );
}

function TComingSoon2(p: SocialPostRenderProps) {
  const photo = p.images[0];
  const olive = '#5B623E';
  const statPair = (icon: string, value: string, isLast = false) => (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginRight: isLast ? 0 : 42 }}>
      <img src={icon} alt="" style={{ width: 46, height: 46, marginRight: 14 }} />
      <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 42, color: olive }}>{value}</div>
    </div>
  );

  return (
    <div style={ROOT}>
      <Cover src={photo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      {p.realtor.logoUrl ? (
        <div
          style={{
            position: 'absolute',
            top: 36,
            right: 36,
            display: 'flex',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 12,
            padding: '10px 18px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          }}
        >
          <img src={p.realtor.logoUrl} alt="" style={{ maxWidth: 200, maxHeight: 64, objectFit: 'contain' }} />
        </div>
      ) : null}
      <div style={{ position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 104, letterSpacing: 3, color: PAPER, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.05 }}>
          {p.label || 'Coming Soon'}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 60,
          height: 420,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255,255,255,0.95)',
          borderTopRightRadius: 28,
          padding: '42px 48px',
          boxSizing: 'border-box',
        }}
      >
        {p.realtor.phone ? (
          <div style={{ display: 'flex', fontFamily: FONT_INSTRUMENT, fontWeight: 400, fontSize: 81, color: olive, lineHeight: 0.95 }}>{p.realtor.phone}</div>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 26 }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            {p.property.bathrooms ? statPair(bathIcon(olive), fmtNum(p.property.bathrooms)) : null}
            {p.property.bedrooms ? statPair(bedIcon(olive), fmtNum(p.property.bedrooms)) : null}
            {p.property.sqft ? statPair(sqftIcon(olive), fmtNum(p.property.sqft), true) : null}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 300 }}>
            {p.realtor.headshotUrl ? (
              <img src={p.realtor.headshotUrl} alt="" style={{ width: 96, height: 96, borderRadius: 48, objectFit: 'cover', border: `3px solid ${olive}`, marginBottom: 10 }} />
            ) : null}
            <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 26, color: olive, textAlign: 'center', lineHeight: 1.15 }}>{p.realtor.name}</div>
            {p.realtor.companyName ? (
              <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 500, fontSize: 22, color: olive, textAlign: 'center', marginTop: 4 }}>{p.realtor.companyName}</div>
            ) : null}
          </div>
        </div>
        {p.property.address ? (
          <div style={{ display: 'flex', fontFamily: FONT_SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 36, color: olive, marginTop: 22 }}>{p.property.address}</div>
        ) : null}
      </div>
    </div>
  );
}

const REGISTRY: Record<string, (p: SocialPostRenderProps) => ReactElement> = {
  'coming-soon': TComingSoon,
  'coming-soon-2': TComingSoon2,
  'coming-soon-3': TComingSoon3,
  'coming-soon-4': TComingSoon4,
  'just-listed': TJustListed,
  'just-listed-1': TJustListed1,
  'just-listed-2': TJustListed2,
  'just-listed-3': TJustListed3,
  'just-listed-4': TJustListed4,
  'new-listing': TNewListing,
  'new-listing-1': TNewListing1,
  'new-listing-2': TNewListing2,
  'new-listing-3': TNewListing3,
  'new-listing-4': TNewListing4,
  'new-on-market': TNewOnMarket,
  'for-sale': TForSale,
  'for-sale-1': TForSale1,
  'for-sale-2': TForSale2,
  'for-sale-3': TForSale3,
  'for-sale-4': TForSale4,
  'featured-listing': TFeaturedListing,
  'price-reduced': TPriceReduced,
  'open-house': TOpenHouse,
  'under-contract': TUnderContract,
  sold: TSold,
  'sold-1': TSold1,
  'sold-2': TSold2,
  'sold-3': TSold3,
  'sold-4': TSold4,
  showcase: TShowcase,
  'agent-brand-card': TAgentBrandCard,
};

export function renderTemplate(input: SocialPostInput): ReactElement {
  const Comp = REGISTRY[input.variantKey] || TForSale;
  const props: SocialPostRenderProps = {
    variantKey: input.variantKey,
    label: input.label,
    images: input.images,
    property: input.property,
    realtor: input.realtor,
    qrDataUrl: input.qrDataUrl,
  };
  return Comp(props);
}

export { BRAND, BRAND_DARK };
