import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing, Sequence } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import type { SlideshowProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { playfairDisplay, inter } from '../../lib/fonts';
import { formatStat } from '../../lib/format';

const INTRO = 120; // title card
const SCENES: number[] = [83, 83, 82, 82];
export const SLIDESHOW_H2_DURATION = INTRO + SCENES.reduce((a, b) => a + b, 0); // 450

const STOPS = (() => {
  const stops: number[] = [];
  let acc = INTRO;
  for (const len of SCENES) {
    stops.push(acc);
    acc += len;
  }
  return stops;
})();

const FADE = 18;
const GOLD = '#d9a441';

const HeroScene: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const opacity =
    Math.min(
      interpolate(frame, [0, FADE], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      interpolate(frame, [SCENES[0] - FADE, SCENES[0]], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    );
  const scale = interpolate(frame, [0, SCENES[0]], [1.1, 1.02], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  return (
    <AbsoluteFill>
      <CameraMotionBlur samples={4} shutterAngle={180}>
        <Img
          src={src}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity,
            transform: `scale(${scale})`,
          }}
        />
      </CameraMotionBlur>
      <AbsoluteFill
        style={{
          background: `linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.4) 45%, rgba(10,10,10,0.25) 100%)`,
          opacity,
        }}
      />
    </AbsoluteFill>
  );
};

const TitleCard: React.FC<{
  src: string;
  property: SlideshowProps['property'];
  realtor: SlideshowProps['realtor'];
}> = ({ src, property, realtor }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const translateY = interpolate(frame, [0, 40], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Img
        src={src}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(22px) brightness(0.45)',
          transform: 'scale(1.15)',
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(to bottom, rgba(10,10,10,0.15), rgba(10,10,10,0.85))`,
        }}
      />
      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          padding: '0 120px',
          opacity,
          translate: `0px ${translateY}px`,
        }}
      >
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 600,
            fontSize: 26,
            color: GOLD,
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
          }}
        >
          Now Showing
        </div>
        <div
          style={{
            fontFamily: playfairDisplay.fontFamily,
            fontWeight: 600,
            fontSize: 92,
            color: '#ffffff',
            lineHeight: 1.05,
            marginTop: 24,
          }}
        >
          {property.street?.trim() || property.address}
        </div>
        <div
          style={{
            width: 120,
            height: 2,
            backgroundColor: GOLD,
            margin: '28px auto 0',
          }}
        />
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 500,
            fontSize: 30,
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginTop: 24,
          }}
        >
          {property.city}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            marginTop: 44,
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `3px solid ${GOLD}`,
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
                fontSize: 26,
                color: '#ffffff',
              }}
            >
              {realtor.name}
            </div>
            <div
              style={{
                fontFamily: inter.fontFamily,
                fontWeight: 700,
                fontSize: 30,
                color: GOLD,
              }}
            >
              {realtor.phone}
            </div>
          </div>
          <Img
            src={realtor.logoUrl}
            style={{
              height: 56,
              maxWidth: 220,
              objectFit: 'contain',
              marginLeft: 24,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const BottomBar: React.FC<{
  property: SlideshowProps['property'];
  realtor: SlideshowProps['realtor'];
}> = ({ property, realtor }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 200,
        background: 'linear-gradient(to top, rgba(10,10,10,0.95), rgba(10,10,10,0))',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: '0 72px 44px',
        opacity,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: playfairDisplay.fontFamily,
            fontWeight: 600,
            fontSize: 46,
            color: '#ffffff',
            lineHeight: 1.1,
          }}
        >
          {property.street?.trim() || property.address}
        </div>
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 500,
            fontSize: 22,
            color: 'rgba(255,255,255,0.75)',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            marginTop: 8,
          }}
        >
          {property.city}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 34 }}>
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
                  fontSize: 38,
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
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.7)',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  marginTop: 6,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            overflow: 'hidden',
            border: `2px solid ${GOLD}`,
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
              fontSize: 19,
              color: '#ffffff',
            }}
          >
            {realtor.name}
          </div>
          <div
            style={{
              fontFamily: inter.fontFamily,
              fontWeight: 700,
              fontSize: 22,
              color: GOLD,
            }}
          >
            {realtor.phone}
          </div>
        </div>
        <Img
          src={realtor.logoUrl}
          style={{ height: 44, maxWidth: 180, objectFit: 'contain', marginLeft: 10 }}
        />
      </div>
    </div>
  );
};

export const SlideshowH2: React.FC<SlideshowProps> = ({
  images,
  property,
  realtor,
  musicTrackUrl,
}) => {
  const sceneImages = [0, 1, 2, 3].map(
    (i) => images[Math.min(i, images.length - 1)] ?? ''
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      {/* Title card */}
      <Sequence from={0} durationInFrames={INTRO} layout="none">
        <TitleCard
          src={images[0] ?? ''}
          property={property}
          realtor={realtor}
        />
      </Sequence>

      {/* Photo scenes with Ken Burns */}
      {sceneImages.map((src, i) => (
        <Sequence
          key={i}
          from={STOPS[i]}
          durationInFrames={SCENES[i]}
          layout="none"
        >
          <HeroScene src={src} />
        </Sequence>
      ))}

      {/* Persistent bottom bar after intro */}
      <Sequence from={INTRO} layout="none">
        <BottomBar property={property} realtor={realtor} />
      </Sequence>

      <MusicOverlay src={musicTrackUrl} volume={0.8} fadeInFrames={15} fadeOutFrames={30} />
    </AbsoluteFill>
  );
};
