import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing, Sequence } from 'remotion';
import type { ReelProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { inter } from '../../lib/fonts';
import { formatStat } from '../../lib/format';

const SCENE = 110;
const FADE = 20;
export const REEL_V6_DURATION = SCENE * 5; // 550 frames = 18.33s

const MinimalScene: React.FC<{ src: string }> = ({ src }) => {
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
  const translateY = interpolate(frame, [0, SCENE], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 950,
          height: 560,
          overflow: 'hidden',
          opacity,
          translate: `0px ${translateY}px`,
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
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Top label */}
      <div
        style={{
          position: 'absolute',
          top: 70,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 500,
            fontSize: 22,
            color: '#a3a3a3',
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
          }}
        >
          New Listing
        </div>
      </div>

      {/* Address — center, above image */}
      <div
        style={{
          position: 'absolute',
          top: 190,
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: '0 100px',
        }}
      >
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 700,
            fontSize: 66,
            color: '#171717',
            lineHeight: 1.1,
          }}
        >
          {property.address}
        </div>
      </div>

      {/* City — below image */}
      <div
        style={{
          position: 'absolute',
          top: 820,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 400,
            fontSize: 30,
            color: '#737373',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}
        >
          {[property.city, property.province].filter(Boolean).join(', ')}
        </div>
        <div
          style={{
            width: 56,
            height: 1,
            backgroundColor: '#d4d4d4',
            margin: '26px auto 0',
          }}
        />
      </div>

      {/* Stats — lower area */}
      <div
        style={{
          position: 'absolute',
          bottom: 240,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 64,
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
                  fontWeight: 600,
                  fontSize: 44,
                  color: '#171717',
                  lineHeight: 1,
                }}
              >
                {formatStat(s.value)}
              </div>
              <div
                style={{
                  fontFamily: inter.fontFamily,
                  fontWeight: 400,
                  fontSize: 18,
                  color: '#a3a3a3',
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

      {/* Agent row — bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 84,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
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
              fontWeight: 600,
              fontSize: 26,
              color: '#171717',
            }}
          >
            {realtor.name}
          </div>
          <div
            style={{
              fontFamily: inter.fontFamily,
              fontWeight: 500,
              fontSize: 28,
              color: '#404040',
            }}
          >
            {realtor.phone}
          </div>
        </div>
        <div
          style={{
            marginLeft: 28,
            borderLeft: '1px solid #e5e5e5',
            paddingLeft: 28,
          }}
        >
          <Img
            src={realtor.logoUrl}
            style={{ height: 48, maxWidth: 220, objectFit: 'contain' }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ReelV6: React.FC<ReelProps> = ({ images, property, realtor, musicTrackUrl }) => {
  const sceneImages = [0, 1, 2, 3, 4].map(
    (i) => images[Math.min(i, images.length - 1)] ?? ''
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      {sceneImages.map((src, i) => (
        <Sequence key={i} from={i * SCENE} durationInFrames={SCENE} layout="none">
          <MinimalScene src={src} />
        </Sequence>
      ))}

      <OverlayElements property={property} realtor={realtor} />

      <MusicOverlay src={musicTrackUrl} volume={0.8} fadeInFrames={15} fadeOutFrames={30} />
    </AbsoluteFill>
  );
};
