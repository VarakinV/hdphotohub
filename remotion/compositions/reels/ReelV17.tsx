import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  useCurrentFrame,
  Easing,
} from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { Ruler, BedDouble, Bath } from 'lucide-react';
import type { ReelProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { ptSans, bebasNeue } from '../../lib/fonts';

export const REEL_V17_DURATION = 480; // 16s @ 30fps

const WHITE = '#ffffff';
const DARK = '#0b1220';
const MUTED = '#cbd5e1';

const CAROUSEL_DURATION = 360; // 12s: 6 images x 60 frames
const CONTACT_FROM = 360;
const CONTACT_DURATION = 120; // 4s final realtor contact scene

const SLOTS = 6;
const SLOT_FRAMES = 60; // hold 40f + slide 20f per image
const HOLD_FRAMES = 40;
const SLOT_PX = 480; // distance between slot centers
const IMG_W = 720;
const IMG_H = 520;
const CAROUSEL_CENTER_Y = 810;
const CENTER_LEFT = 180; // left offset of the centered image

// Strip offset in px. Each image holds centered for HOLD_FRAMES, then slides
// to the next slot over the remaining frames of its cycle. The last image
// holds in place (contact scene fades in on top of it).
function carouselOffset(frame: number): number {
  const t = Math.min(frame, CAROUSEL_DURATION);
  const step = Math.floor(t / SLOT_FRAMES);
  const p = t % SLOT_FRAMES;
  if (step >= SLOTS - 1) return (SLOTS - 1) * SLOT_PX;
  const progress =
    p < HOLD_FRAMES ? 0 : Easing.inOut(Easing.cubic)((p - HOLD_FRAMES) / (SLOT_FRAMES - HOLD_FRAMES));
  return (step + progress) * SLOT_PX;
}

const CarouselImage: React.FC<{ src: string; index: number; frame: number }> = ({
  src,
  index,
  frame,
}) => {
  const offset = carouselOffset(frame);
  const centerSlot = offset / SLOT_PX;
  const distance = Math.min(Math.abs(centerSlot - index), 1);
  const scale = 1 - 0.12 * distance;
  const opacity = 1 - 0.2 * distance;
  const zIndex = Math.round(10 - distance * 5);

  return (
    <CameraMotionBlur samples={8} shutterAngle={180}>
      <div
        style={{
          position: 'absolute',
          top: CAROUSEL_CENTER_Y - IMG_H / 2,
          left: CENTER_LEFT + index * SLOT_PX - offset,
          width: IMG_W,
          height: IMG_H,
          opacity,
          zIndex,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            borderRadius: 8,
            border: `6px solid ${WHITE}`,
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            backgroundColor: WHITE,
          }}
        >
          <Img
            src={src}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      </div>
    </CameraMotionBlur>
  );
};

const StatItem: React.FC<{
  icon: React.ReactNode;
  value?: string | number;
  label: string;
}> = ({ icon, value, label }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div style={{ color: WHITE, opacity: 0.95 }}>{icon}</div>
      <div
        style={{
          fontFamily: bebasNeue.fontFamily,
          fontSize: 46,
          lineHeight: 1,
          color: WHITE,
          letterSpacing: '0.04em',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: ptSans.fontFamily,
          fontSize: 24,
          lineHeight: 1,
          color: WHITE,
          opacity: 0.85,
          letterSpacing: '0.25em',
        }}
      >
        {label}
      </div>
    </div>
  );
};

const StatsRow: React.FC<{ property: ReelProps['property'] }> = ({ property }) => (
  <div
    style={{
      position: 'absolute',
      top: 1160,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      gap: 130,
      zIndex: 20,
    }}
  >
    <StatItem
      icon={<Ruler size={42} strokeWidth={1.6} />}
      value={property.sqft}
      label="SQ FT"
    />
    <StatItem
      icon={<BedDouble size={42} strokeWidth={1.6} />}
      value={property.bedrooms}
      label="BEDS"
    />
    <StatItem
      icon={<Bath size={42} strokeWidth={1.6} />}
      value={property.bathrooms}
      label="BATHS"
    />
  </div>
);

const AddressBlock: React.FC<{ property: ReelProps['property'] }> = ({ property }) => {
  const streetLine =
    property.street?.trim() ||
    property.address.split(',')[0]?.trim() ||
    property.address;

  return (
    <div style={{ position: 'absolute', top: 1340, left: 0, right: 0, zIndex: 20 }}>
      <div
        style={{
          textAlign: 'center',
          color: WHITE,
          fontFamily: ptSans.fontFamily,
          fontSize: 46,
          fontWeight: 700,
          lineHeight: 1.2,
          padding: '0 60px',
          textShadow: '0 2px 8px rgba(0,0,0,0.35)',
        }}
      >
        {streetLine}
      </div>
      <div
        style={{
          marginTop: 10,
          textAlign: 'center',
          color: WHITE,
          opacity: 0.9,
          fontFamily: ptSans.fontFamily,
          fontSize: 32,
          fontWeight: 400,
          lineHeight: 1.2,
          padding: '0 60px',
          textShadow: '0 2px 8px rgba(0,0,0,0.35)',
        }}
      >
        {property.city}
      </div>
    </div>
  );
};

const ContactScene: React.FC<{ realtor: ReelProps['realtor'] }> = ({ realtor }) => {
  const frame = useCurrentFrame();

  const fade = (from: number, to: number) =>
    interpolate(frame, [from, to], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.33, 1, 0.67, 1),
    });

  const overlayOpacity = fade(0, 30);
  const logoOpacity = fade(0, 20);
  const headshotOpacity = fade(8, 28);
  const nameOpacity = fade(16, 36);
  const phoneOpacity = fade(24, 44);
  const headshotScale = 0.92 + 0.08 * headshotOpacity;

  return (
    <AbsoluteFill style={{ backgroundColor: DARK, opacity: overlayOpacity, zIndex: 100 }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Img
          src={realtor.logoUrl}
          style={{
            height: 110,
            width: 460,
            objectFit: 'contain',
            opacity: logoOpacity,
          }}
        />

        <div
          style={{
            marginTop: 40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            border: `5px solid ${WHITE}`,
            overflow: 'hidden',
            backgroundColor: WHITE,
            opacity: headshotOpacity,
            transform: `scale(${headshotScale})`,
            boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
          }}
        >
          <Img
            src={realtor.headshotUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        <div
          style={{
            marginTop: 32,
            textAlign: 'center',
            color: WHITE,
            fontFamily: bebasNeue.fontFamily,
            fontSize: 78,
            fontWeight: 400,
            letterSpacing: '0.06em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            opacity: nameOpacity,
          }}
        >
          {realtor.name}
        </div>

        <div
          style={{
            marginTop: 14,
            textAlign: 'center',
            color: MUTED,
            fontFamily: ptSans.fontFamily,
            fontSize: 36,
            fontWeight: 400,
            letterSpacing: '0.04em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            opacity: phoneOpacity,
          }}
        >
          {realtor.phone}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ReelV17: React.FC<ReelProps> = ({
  images,
  property,
  realtor,
  musicTrackUrl,
}) => {
  const frame = useCurrentFrame();
  const imageSources = Array.from(
    { length: SLOTS },
    (_, i) => images[Math.min(i, images.length - 1)] ?? ''
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 1920 }}>
        <Img
          src={imageSources[0]}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.5,
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: WHITE,
          fontFamily: bebasNeue.fontFamily,
          fontSize: 96,
          fontWeight: 400,
          letterSpacing: '0.08em',
          lineHeight: 1,
          textShadow: '0 2px 10px rgba(0,0,0,0.35)',
          zIndex: 20,
        }}
      >
        NEW LISTING
      </div>

      <div style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 1920 }}>
        {imageSources.map((src, i) => (
          <CarouselImage key={i} src={src} index={i} frame={frame} />
        ))}
      </div>

      <StatsRow property={property} />
      <AddressBlock property={property} />

      <Img
        src={realtor.logoUrl}
        style={{
          position: 'absolute',
          left: 350,
          top: 1710,
          width: 380,
          height: 110,
          objectFit: 'contain',
          zIndex: 20,
        }}
      />

      <Sequence from={CONTACT_FROM} durationInFrames={CONTACT_DURATION} layout="none">
        <ContactScene realtor={realtor} />
      </Sequence>

      <MusicOverlay
        src={musicTrackUrl}
        volume={0.8}
        fadeInFrames={15}
        fadeOutFrames={30}
      />
    </AbsoluteFill>
  );
};
