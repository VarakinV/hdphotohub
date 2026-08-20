import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing, Sequence } from 'remotion';
import type { ReelProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { playfairDisplay, inter } from '../../lib/fonts';
import { formatStat } from '../../lib/format';

const SCENE = 110;
const FADE = 20;
export const REEL_V8_DURATION = SCENE * 5; // 550 frames = 18.33s

const NAVY = '#1f2c56';
const RED = '#b5412f';
const CREAM = '#f7f1e3';

const ClassicScene: React.FC<{ src: string }> = ({ src }) => {
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
  const translateY = interpolate(frame, [0, SCENE], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 960,
          height: 900,
          border: `10px solid ${CREAM}`,
          boxShadow: '0 24px 80px rgba(31,44,86,0.35)',
          opacity,
          translate: `0px ${translateY}px`,
          overflow: 'hidden',
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
      {/* Navy header band */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 190,
          backgroundColor: NAVY,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 80px',
        }}
      >
        <div
          style={{
            fontFamily: playfairDisplay.fontFamily,
            fontWeight: 700,
            fontSize: 34,
            color: CREAM,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          Est.
        </div>
        <Img
          src={realtor.logoUrl}
          style={{ height: 76, maxWidth: 320, objectFit: 'contain' }}
        />
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: '50%',
            overflow: 'hidden',
            border: `4px solid ${RED}`,
          }}
        >
          <Img
            src={realtor.headshotUrl}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Red rule */}
      <div
        style={{
          position: 'absolute',
          top: 190,
          left: 0,
          right: 0,
          height: 8,
          backgroundColor: RED,
        }}
      />

      {/* Address + city — below header */}
      <div
        style={{
          position: 'absolute',
          top: 250,
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: '0 100px',
        }}
      >
        <div
          style={{
            fontFamily: playfairDisplay.fontFamily,
            fontWeight: 700,
            fontSize: 56,
            color: NAVY,
            lineHeight: 1.12,
          }}
        >
          {property.address}
        </div>
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 600,
            fontSize: 28,
            color: RED,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            marginTop: 14,
          }}
        >
          {[property.city, property.province].filter(Boolean).join(', ')}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            justifyContent: 'center',
            marginTop: 20,
          }}
        >
          <div style={{ width: 160, height: 2, backgroundColor: NAVY }} />
          <div style={{ width: 10, height: 10, backgroundColor: RED, transform: 'rotate(45deg)' }} />
          <div style={{ width: 160, height: 2, backgroundColor: NAVY }} />
        </div>
      </div>

      {/* Stats — bottom area */}
      <div
        style={{
          position: 'absolute',
          bottom: 240,
          left: 0,
          right: 0,
          display: 'flex',
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
            <div
              key={s.label}
              style={{
                textAlign: 'center',
                border: `2px solid ${NAVY}`,
                padding: '16px 30px',
                backgroundColor: CREAM,
              }}
            >
              <div
                style={{
                  fontFamily: playfairDisplay.fontFamily,
                  fontWeight: 700,
                  fontSize: 44,
                  color: NAVY,
                  lineHeight: 1,
                }}
              >
                {formatStat(s.value)}
              </div>
              <div
                style={{
                  fontFamily: inter.fontFamily,
                  fontWeight: 600,
                  fontSize: 16,
                  color: RED,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  marginTop: 6,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
      </div>

      {/* Agent — bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 74,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: playfairDisplay.fontFamily,
            fontWeight: 600,
            fontSize: 34,
            color: NAVY,
          }}
        >
          {realtor.name}
        </div>
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 700,
            fontSize: 40,
            color: RED,
            marginTop: 4,
          }}
        >
          {realtor.phone}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ReelV8: React.FC<ReelProps> = ({ images, property, realtor, musicTrackUrl }) => {
  const sceneImages = [0, 1, 2, 3, 4].map(
    (i) => images[Math.min(i, images.length - 1)] ?? ''
  );

  return (
    <AbsoluteFill style={{ backgroundColor: CREAM }}>
      {sceneImages.map((src, i) => (
        <Sequence key={i} from={i * SCENE} durationInFrames={SCENE} layout="none">
          <ClassicScene src={src} />
        </Sequence>
      ))}

      <OverlayElements property={property} realtor={realtor} />

      <MusicOverlay src={musicTrackUrl} volume={0.8} fadeInFrames={15} fadeOutFrames={30} />
    </AbsoluteFill>
  );
};
