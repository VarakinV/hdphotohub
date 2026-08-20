import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing, Sequence } from 'remotion';
import type { ReelProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { inter } from '../../lib/fonts';
import { formatStat } from '../../lib/format';

const SCENE = 110;
const FADE = 18;
export const REEL_V5_DURATION = SCENE * 5; // 550 frames = 18.33s

const CORAL = '#ff4d2e';
const INK = '#141414';
const CREAM = '#fff7ec';

const BoldScene: React.FC<{ src: string }> = ({ src }) => {
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
  const rotate = interpolate(frame, [0, SCENE], [4, -4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 980,
          height: 1080,
          transform: `rotate(${rotate}deg)`,
          opacity,
          clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
          overflow: 'hidden',
          backgroundColor: INK,
          boxShadow: '0 30px 90px rgba(0,0,0,0.35)',
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
      {/* Top color block with headline */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 300,
          backgroundColor: CORAL,
          paddingTop: 44,
          paddingLeft: 84,
          paddingRight: 84,
        }}
      >
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 900,
            fontSize: 30,
            color: INK,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            marginBottom: 18,
          }}
        >
          Just Listed
        </div>
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 900,
            fontSize: 62,
            color: CREAM,
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          {property.address}
        </div>
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 700,
            fontSize: 30,
            color: INK,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginTop: 16,
          }}
        >
          {[property.city, property.province].filter(Boolean).join(' · ')}
        </div>
      </div>

      {/* Bottom stats strip */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 210,
          backgroundColor: INK,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 70,
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
                  fontFamily: inter.fontFamily,
                  fontWeight: 900,
                  fontSize: 64,
                  color: CORAL,
                  lineHeight: 1,
                }}
              >
                {formatStat(s.value)}
              </div>
              <div
                style={{
                  fontFamily: inter.fontFamily,
                  fontWeight: 700,
                  fontSize: 20,
                  color: CREAM,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  marginTop: 8,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
      </div>

      {/* Agent pill — between image and bottom strip */}
      <div
        style={{
          position: 'absolute',
          bottom: 300,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: CREAM,
            borderRadius: 999,
            padding: '14px 34px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `3px solid ${CORAL}`,
            }}
          >
            <Img
              src={realtor.headshotUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <div
              style={{
                fontFamily: inter.fontFamily,
                fontWeight: 800,
                fontSize: 26,
                color: INK,
              }}
            >
              {realtor.name}
            </div>
            <div
              style={{
                fontFamily: inter.fontFamily,
                fontWeight: 800,
                fontSize: 30,
                color: CORAL,
              }}
            >
              {realtor.phone}
            </div>
          </div>
        </div>
      </div>

      {/* Brokerage logo — below top block */}
      <div
        style={{
          position: 'absolute',
          top: 322,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Img
          src={realtor.logoUrl}
          style={{ height: 64, maxWidth: 300, objectFit: 'contain', opacity: 0.92 }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const ReelV5: React.FC<ReelProps> = ({ images, property, realtor, musicTrackUrl }) => {
  const sceneImages = [0, 1, 2, 3, 4].map(
    (i) => images[Math.min(i, images.length - 1)] ?? ''
  );

  return (
    <AbsoluteFill style={{ backgroundColor: CREAM }}>
      {sceneImages.map((src, i) => (
        <Sequence key={i} from={i * SCENE} durationInFrames={SCENE} layout="none">
          <BoldScene src={src} />
        </Sequence>
      ))}

      <OverlayElements property={property} realtor={realtor} />

      <MusicOverlay src={musicTrackUrl} volume={0.8} fadeInFrames={15} fadeOutFrames={30} />
    </AbsoluteFill>
  );
};
