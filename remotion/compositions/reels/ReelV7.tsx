import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing, Sequence } from 'remotion';
import type { ReelProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { playfairDisplay, inter } from '../../lib/fonts';
import { formatStat } from '../../lib/format';

const SCENE = 110;
const FADE = 20;
export const REEL_V7_DURATION = SCENE * 5; // 550 frames = 18.33s

const GOLD = '#c9a227';
const NIGHT = '#0a0a0a';

const LuxuryScene: React.FC<{ src: string }> = ({ src }) => {
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
          width: 940,
          height: 1060,
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: `1px solid ${GOLD}`,
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -2,
            left: -2,
            width: 110,
            height: 110,
            borderTop: `6px solid ${GOLD}`,
            borderLeft: `6px solid ${GOLD}`,
            zIndex: 3,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 110,
            height: 110,
            borderTop: `6px solid ${GOLD}`,
            borderRight: `6px solid ${GOLD}`,
            zIndex: 3,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            left: -2,
            width: 110,
            height: 110,
            borderBottom: `6px solid ${GOLD}`,
            borderLeft: `6px solid ${GOLD}`,
            zIndex: 3,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 110,
            height: 110,
            borderBottom: `6px solid ${GOLD}`,
            borderRight: `6px solid ${GOLD}`,
            zIndex: 3,
          }}
        />
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#1a1a1a',
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
      {/* Top tag + logo */}
      <div
        style={{
          position: 'absolute',
          top: 64,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 26,
        }}
      >
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 600,
            fontSize: 22,
            color: GOLD,
            letterSpacing: '0.55em',
            textTransform: 'uppercase',
            padding: '10px 28px',
            border: `1px solid ${GOLD}`,
          }}
        >
          Luxury Estate
        </div>
        <Img
          src={realtor.logoUrl}
          style={{ height: 70, maxWidth: 300, objectFit: 'contain' }}
        />
      </div>

      {/* Address — bottom area */}
      <div
        style={{
          position: 'absolute',
          bottom: 320,
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
            fontSize: 60,
            color: '#ffffff',
            lineHeight: 1.15,
            textShadow: '0 4px 40px rgba(0,0,0,0.8)',
          }}
        >
          {property.address}
        </div>
        <div
          style={{
            width: 120,
            height: 1,
            backgroundColor: GOLD,
            margin: '22px auto 0',
          }}
        />
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 500,
            fontSize: 28,
            color: '#d4d4d4',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            marginTop: 18,
          }}
        >
          {[property.city, property.province].filter(Boolean).join(', ')}
        </div>
      </div>

      {/* Stats — above agent */}
      <div
        style={{
          position: 'absolute',
          bottom: 196,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 60,
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
                  fontWeight: 600,
                  fontSize: 46,
                  color: GOLD,
                  lineHeight: 1,
                }}
              >
                {formatStat(s.value)}
              </div>
              <div
                style={{
                  fontFamily: inter.fontFamily,
                  fontWeight: 500,
                  fontSize: 16,
                  color: '#8a8a8a',
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

      {/* Agent — bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
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
            width: 84,
            height: 84,
            borderRadius: '50%',
            overflow: 'hidden',
            border: `2px solid ${GOLD}`,
            padding: 4,
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
              fontSize: 30,
              color: '#ffffff',
            }}
          >
            {realtor.name}
          </div>
          <div
            style={{
              fontFamily: inter.fontFamily,
              fontWeight: 600,
              fontSize: 34,
              color: GOLD,
              marginTop: 2,
            }}
          >
            {realtor.phone}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ReelV7: React.FC<ReelProps> = ({ images, property, realtor, musicTrackUrl }) => {
  const sceneImages = [0, 1, 2, 3, 4].map(
    (i) => images[Math.min(i, images.length - 1)] ?? ''
  );

  return (
    <AbsoluteFill style={{ backgroundColor: NIGHT }}>
      {sceneImages.map((src, i) => (
        <Sequence key={i} from={i * SCENE} durationInFrames={SCENE} layout="none">
          <LuxuryScene src={src} />
        </Sequence>
      ))}

      <OverlayElements property={property} realtor={realtor} />

      <MusicOverlay src={musicTrackUrl} volume={0.8} fadeInFrames={15} fadeOutFrames={30} />
    </AbsoluteFill>
  );
};
