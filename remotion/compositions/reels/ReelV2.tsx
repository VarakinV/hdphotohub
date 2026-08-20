import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing, Sequence } from 'remotion';
import type { ReelProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { inter } from '../../lib/fonts';
import { formatStat } from '../../lib/format';

const SCENE = 110; // 3.67s per scene at 30fps
const FADE = 18;
export const REEL_V2_DURATION = SCENE * 5; // 550 frames = 18.33s

const STATS: Array<{ key: 'bedrooms' | 'bathrooms' | 'sqft'; label: string }> = [
  { key: 'bedrooms', label: 'Beds' },
  { key: 'bathrooms', label: 'Baths' },
  { key: 'sqft', label: 'Sq Ft' },
];

const ForSaleScene: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const opacity =
    Math.min(
      interpolate(frame, [0, FADE], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      interpolate(frame, [SCENE - FADE, SCENE], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    );
  const slideIn = interpolate(frame, [0, 55], [180, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const scale = interpolate(frame, [0, SCENE], [1.12, 1.02], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <Img
        src={src}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity,
          transform: `scale(${scale}) translateX(${slideIn}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.45) 38%, rgba(15,23,42,0.1) 100%)',
          opacity,
        }}
      />
    </AbsoluteFill>
  );
};

const ForSaleBadge: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const translateY = interpolate(frame, [0, 30], [-24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 64,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        translate: `0px ${translateY}px`,
      }}
    >
      <div
        style={{
          backgroundColor: '#fbbf24',
          borderRadius: 14,
          padding: '14px 44px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
        }}
      >
        <span
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 800,
            fontSize: 44,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: '#0f172a',
          }}
        >
          For Sale
        </span>
      </div>
    </div>
  );
};

const OverlayElements: React.FC<{
  property: ReelProps['property'];
  realtor: ReelProps['realtor'];
}> = ({ property, realtor }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const stats = STATS.map((s, i) => {
    const value = property[s.key];
    if (s.key === 'sqft' && !value) return null;
    return (
      <div
        key={s.key}
        style={{
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: 12,
          padding: '10px 20px',
          border: '1px solid rgba(255,255,255,0.2)',
          opacity: interpolate(frame, [20 + i * 8, 45 + i * 8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          translate: `0px ${interpolate(frame, [20 + i * 8, 45 + i * 8], [18, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })}px`,
        }}
      >
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 800,
            fontSize: 40,
            color: '#fbbf24',
            lineHeight: 1,
          }}
        >
          {formatStat(value)}
        </div>
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 500,
            fontSize: 20,
            color: 'rgba(255,255,255,0.8)',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            marginTop: 4,
          }}
        >
          {s.label}
        </div>
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Brokerage logo — top right */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          right: 52,
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderRadius: 14,
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Img
          src={realtor.logoUrl}
          style={{ width: 220, height: 68, objectFit: 'contain' }}
        />
      </div>

      {/* Address + city + stats — bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: 316,
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: '0 56px',
        }}
      >
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 800,
            fontSize: 64,
            color: '#ffffff',
            lineHeight: 1.05,
            textShadow: '0 4px 30px rgba(0,0,0,0.6)',
          }}
        >
          {property.address}
        </div>
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 500,
            fontSize: 36,
            color: 'rgba(255,255,255,0.92)',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            marginTop: 14,
          }}
        >
          {[property.city, property.province].filter(Boolean).join(', ')}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 18,
            marginTop: 30,
          }}
        >
          {stats}
        </div>
      </div>

      {/* Agent row — bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 56,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: '50%',
            border: '3px solid #fbbf24',
            overflow: 'hidden',
            backgroundColor: '#1e293b',
          }}
        >
          <Img
            src={realtor.headshotUrl}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div style={{ textAlign: 'left' }}>
          <div
            style={{
              fontFamily: inter.fontFamily,
              fontWeight: 700,
              fontSize: 34,
              color: '#ffffff',
            }}
          >
            {realtor.name}
          </div>
          <div
            style={{
              fontFamily: inter.fontFamily,
              fontWeight: 700,
              fontSize: 40,
              color: '#fbbf24',
            }}
          >
            {realtor.phone}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ReelV2: React.FC<ReelProps> = ({ images, property, realtor, musicTrackUrl }) => {
  const sceneImages = [0, 1, 2, 3, 4].map(
    (i) => images[Math.min(i, images.length - 1)] ?? ''
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      {sceneImages.map((src, i) => (
        <Sequence key={i} from={i * SCENE} durationInFrames={SCENE} layout="none">
          <ForSaleScene src={src} />
        </Sequence>
      ))}

      <ForSaleBadge frame={0} />
      <OverlayElements property={property} realtor={realtor} />

      <MusicOverlay src={musicTrackUrl} volume={0.8} fadeInFrames={15} fadeOutFrames={30} />
    </AbsoluteFill>
  );
};
