import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing, Sequence } from 'remotion';
import type { ReelProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { playfairDisplay, inter } from '../../lib/fonts';
import { formatStat } from '../../lib/format';

const SCENE = 110;
const FADE = 20;
export const REEL_V9_DURATION = SCENE * 5; // 550 frames = 18.33s

const RUST = '#a1541b';
const OLIVE = '#6b705c';
const CREAM = '#f8eede';

const SeasonalScene: React.FC<{ src: string }> = ({ src }) => {
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
  const scale = interpolate(frame, [0, SCENE], [1.07, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 930,
          height: 980,
          borderRadius: 28,
          border: `12px solid #ffffff`,
          boxShadow: '0 24px 80px rgba(122,68,20,0.28)',
          overflow: 'hidden',
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        <Img
          src={src}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    </AbsoluteFill>
  );
};

const Leaf: React.FC<{ size: number; rotate: number; color: string }> = ({
  size,
  rotate,
  color,
}) => (
  <div
    style={{
      width: size,
      height: size,
      transform: `rotate(${rotate}deg)`,
      backgroundColor: color,
      borderRadius: '0 60% 0 60%',
      opacity: 0.85,
    }}
  />
);

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

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Top heading */}
      <div
        style={{
          position: 'absolute',
          top: 84,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 22,
          }}
        >
          <Leaf size={26} rotate={-18} color={RUST} />
          <span
            style={{
              fontFamily: inter.fontFamily,
              fontWeight: 600,
              fontSize: 24,
              color: OLIVE,
              letterSpacing: '0.44em',
              textTransform: 'uppercase',
            }}
          >
            This Season
          </span>
          <Leaf size={26} rotate={22} color={RUST} />
        </div>
        <div
          style={{
            fontFamily: playfairDisplay.fontFamily,
            fontWeight: 600,
            fontSize: 62,
            color: '#4a2c12',
            lineHeight: 1.15,
            marginTop: 22,
            padding: '0 100px',
          }}
        >
          {property.address}
        </div>
      </div>

      {/* City — below image */}
      <div
        style={{
          position: 'absolute',
          top: 1130,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 500,
            fontSize: 30,
            color: RUST,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
          }}
        >
          {[property.city, property.province].filter(Boolean).join(', ')}
        </div>
      </div>

      {/* Stats — bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 220,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 56,
        }}
      >
        {[
          { value: property.bedrooms, label: 'Beds' },
          { value: property.bathrooms, label: 'Baths' },
          property.sqft ? { value: property.sqft, label: 'Sq Ft' } : null,
        ]
          .filter(Boolean)
          .map((s: any) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: playfairDisplay.fontFamily,
                  fontWeight: 700,
                  fontSize: 48,
                  color: '#4a2c12',
                  lineHeight: 1,
                }}
              >
                {formatStat(s.value)}
              </div>
              <div
                style={{
                  fontFamily: inter.fontFamily,
                  fontWeight: 500,
                  fontSize: 18,
                  color: OLIVE,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  marginTop: 8,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
      </div>

      {/* Agent + logo — bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 76,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 26,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            overflow: 'hidden',
            border: `3px solid ${RUST}`,
            backgroundColor: '#fff',
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
              fontFamily: playfairDisplay.fontFamily,
              fontWeight: 600,
              fontSize: 30,
              color: '#4a2c12',
            }}
          >
            {realtor.name}
          </div>
          <div
            style={{
              fontFamily: inter.fontFamily,
              fontWeight: 700,
              fontSize: 34,
              color: RUST,
              marginTop: 2,
            }}
          >
            {realtor.phone}
          </div>
        </div>
        <div
          style={{
            marginLeft: 18,
            borderLeft: '1px solid #d9c4a4',
            paddingLeft: 26,
          }}
        >
          <Img
            src={realtor.logoUrl}
            style={{ height: 56, maxWidth: 240, objectFit: 'contain' }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ReelV9: React.FC<ReelProps> = ({ images, property, realtor, musicTrackUrl }) => {
  const sceneImages = [0, 1, 2, 3, 4].map(
    (i) => images[Math.min(i, images.length - 1)] ?? ''
  );

  return (
    <AbsoluteFill style={{ backgroundColor: CREAM }}>
      {sceneImages.map((src, i) => (
        <Sequence key={i} from={i * SCENE} durationInFrames={SCENE} layout="none">
          <SeasonalScene src={src} />
        </Sequence>
      ))}

      <OverlayElements property={property} realtor={realtor} />

      <MusicOverlay src={musicTrackUrl} volume={0.8} fadeInFrames={15} fadeOutFrames={30} />
    </AbsoluteFill>
  );
};
