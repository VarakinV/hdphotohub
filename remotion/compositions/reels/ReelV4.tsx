import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing, Sequence } from 'remotion';
import type { ReelProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { playfairDisplay, inter } from '../../lib/fonts';
import { formatStat } from '../../lib/format';

const SCENE = 110;
const FADE = 20;
export const REEL_V4_DURATION = SCENE * 5; // 550 frames = 18.33s

const GOLD = '#a9855c';
const IVORY = '#faf7f2';

const ElegantScene: React.FC<{ src: string }> = ({ src }) => {
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
  const scale = interpolate(frame, [0, SCENE], [1.05, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 900,
          height: 1040,
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: `3px solid ${GOLD}`,
            borderRadius: 4,
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: -14,
            width: 70,
            height: 70,
            borderTop: `4px solid ${GOLD}`,
            borderLeft: `4px solid ${GOLD}`,
            zIndex: 3,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -14,
            right: -14,
            width: 70,
            height: 70,
            borderBottom: `4px solid ${GOLD}`,
            borderRight: `4px solid ${GOLD}`,
            zIndex: 3,
          }}
        />
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            borderRadius: 4,
            backgroundColor: '#e9e2d5',
          }}
        >
          <Img
            src={src}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const OrnamentLine: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      justifyContent: 'center',
      marginTop: 22,
    }}
  >
    <div style={{ width: 90, height: 1, backgroundColor: GOLD }} />
    <div
      style={{
        width: 8,
        height: 8,
        transform: 'rotate(45deg)',
        backgroundColor: GOLD,
      }}
    />
    <div style={{ width: 90, height: 1, backgroundColor: GOLD }} />
  </div>
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
      {/* Address + city — top */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: '0 90px',
        }}
      >
        <div
          style={{
            fontFamily: playfairDisplay.fontFamily,
            fontWeight: 500,
            fontSize: 58,
            color: '#2f2a24',
            lineHeight: 1.15,
          }}
        >
          {property.address}
        </div>
        <OrnamentLine />
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 500,
            fontSize: 30,
            color: GOLD,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            marginTop: 16,
          }}
        >
          {[property.city, property.province].filter(Boolean).join(', ')}
        </div>
      </div>

      {/* Stats — bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: 140,
          left: 90,
          display: 'flex',
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
            <div key={s.label} style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontFamily: playfairDisplay.fontFamily,
                  fontWeight: 700,
                  fontSize: 52,
                  color: '#2f2a24',
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
                  color: GOLD,
                  textTransform: 'uppercase',
                  letterSpacing: '0.22em',
                  marginTop: 8,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
      </div>

      {/* Agent — bottom right */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          right: 90,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            overflow: 'hidden',
            border: `3px solid ${GOLD}`,
            padding: 5,
            backgroundColor: IVORY,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              overflow: 'hidden',
            }}
          >
            <Img
              src={realtor.headshotUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div
            style={{
              fontFamily: playfairDisplay.fontFamily,
              fontWeight: 600,
              fontSize: 32,
              color: '#2f2a24',
            }}
          >
            {realtor.name}
          </div>
          <div
            style={{
              fontFamily: inter.fontFamily,
              fontWeight: 600,
              fontSize: 32,
              color: GOLD,
              marginTop: 4,
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
          bottom: 46,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Img
          src={realtor.logoUrl}
          style={{ height: 56, maxWidth: 300, objectFit: 'contain', opacity: 0.9 }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const ReelV4: React.FC<ReelProps> = ({ images, property, realtor, musicTrackUrl }) => {
  const sceneImages = [0, 1, 2, 3, 4].map(
    (i) => images[Math.min(i, images.length - 1)] ?? ''
  );

  return (
    <AbsoluteFill style={{ backgroundColor: IVORY }}>
      {sceneImages.map((src, i) => (
        <Sequence key={i} from={i * SCENE} durationInFrames={SCENE} layout="none">
          <ElegantScene src={src} />
        </Sequence>
      ))}

      <OverlayElements property={property} realtor={realtor} />

      <MusicOverlay src={musicTrackUrl} volume={0.8} fadeInFrames={15} fadeOutFrames={30} />
    </AbsoluteFill>
  );
};
