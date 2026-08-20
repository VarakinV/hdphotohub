import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing, Sequence } from 'remotion';
import type { ReelProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { inter } from '../../lib/fonts';
import { formatStat } from '../../lib/format';

const SCENE = 110;
const FADE = 18;
export const REEL_V3_DURATION = SCENE * 5; // 550 frames = 18.33s

const ModernScene: React.FC<{ src: string }> = ({ src }) => {
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
  const scale = interpolate(frame, [0, SCENE], [1.08, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 950,
          height: 950,
          borderRadius: 32,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
          opacity,
        }}
      >
        <Img
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${scale})`,
          }}
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
      {/* Headline — top */}
      <div
        style={{
          position: 'absolute',
          top: 92,
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: '0 70px',
        }}
      >
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 800,
            fontSize: 76,
            color: '#18181b',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}
        >
          {property.address}
        </div>
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 500,
            fontSize: 34,
            color: '#52525b',
            marginTop: 16,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {[property.city, property.province].filter(Boolean).join(', ')}
        </div>
      </div>

      {/* Stats — bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: 96,
          left: 76,
          display: 'flex',
          gap: 40,
        }}
      >
        {[
          { value: property.bedrooms, label: 'Beds' },
          { value: property.bathrooms, label: 'Baths' },
          property.sqft ? { value: property.sqft, label: 'Sq Ft' } : null,
        ]
          .filter(Boolean)
          .map((s: any, i) => (
            <div key={s.label} style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontFamily: inter.fontFamily,
                  fontWeight: 800,
                  fontSize: 52,
                  color: '#18181b',
                  lineHeight: 1,
                }}
              >
                {formatStat(s.value)}
              </div>
              <div
                style={{
                  fontFamily: inter.fontFamily,
                  fontWeight: 500,
                  fontSize: 20,
                  color: '#71717a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  marginTop: 6,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
      </div>

      {/* Agent bar — bottom right */}
      <div
        style={{
          position: 'absolute',
          bottom: 84,
          right: 76,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: '#e4e4e7',
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
              fontSize: 30,
              color: '#18181b',
            }}
          >
            {realtor.name}
          </div>
          <div
            style={{
              fontFamily: inter.fontFamily,
              fontWeight: 600,
              fontSize: 34,
              color: '#16a34a',
            }}
          >
            {realtor.phone}
          </div>
        </div>
      </div>

      {/* Brokerage logo — bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: 44,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Img
          src={realtor.logoUrl}
          style={{ height: 64, maxWidth: 320, objectFit: 'contain', opacity: 0.85 }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const ReelV3: React.FC<ReelProps> = ({ images, property, realtor, musicTrackUrl }) => {
  const sceneImages = [0, 1, 2, 3, 4].map(
    (i) => images[Math.min(i, images.length - 1)] ?? ''
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#fafafa' }}>
      {sceneImages.map((src, i) => (
        <Sequence key={i} from={i * SCENE} durationInFrames={SCENE} layout="none">
          <ModernScene src={src} />
        </Sequence>
      ))}

      <OverlayElements property={property} realtor={realtor} />

      <MusicOverlay src={musicTrackUrl} volume={0.8} fadeInFrames={15} fadeOutFrames={30} />
    </AbsoluteFill>
  );
};
