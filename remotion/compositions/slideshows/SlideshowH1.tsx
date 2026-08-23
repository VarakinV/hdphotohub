import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing, Sequence } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import type { SlideshowProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { playfairDisplay, inter } from '../../lib/fonts';
import { formatStat } from '../../lib/format';

const SCENE = 90; // 3s per scene at 30fps
const FADE = 20;
export const SLIDESHOW_H1_DURATION = SCENE * 5; // 450 frames = 15s

const PanelScene: React.FC<{ src: string }> = ({ src }) => {
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
  const scale = interpolate(frame, [0, SCENE], [1.06, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 640,
          top: 0,
          right: 0,
          bottom: 0,
          opacity,
          overflow: 'hidden',
          backgroundColor: '#111',
        }}
      >
        <CameraMotionBlur samples={8} shutterAngle={180}>
          <Img
            src={src}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${scale})`,
            }}
          />
        </CameraMotionBlur>
      </div>
    </AbsoluteFill>
  );
};

const InfoPanel: React.FC<{
  property: SlideshowProps['property'];
  realtor: SlideshowProps['realtor'];
}> = ({ property, realtor }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const translateY = interpolate(frame, [0, 35], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 640,
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 56px',
          opacity,
          translate: `0px ${translateY}px`,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: inter.fontFamily,
              fontWeight: 600,
              fontSize: 22,
              color: '#a16207',
              letterSpacing: '0.42em',
              textTransform: 'uppercase',
            }}
          >
            Just Listed
          </div>
          <div
            style={{
              fontFamily: playfairDisplay.fontFamily,
              fontWeight: 700,
              fontSize: 62,
              color: '#111827',
              lineHeight: 1.1,
              marginTop: 20,
            }}
          >
            {property.street?.trim() || property.address}
          </div>
          <div
            style={{
              fontFamily: inter.fontFamily,
              fontWeight: 500,
              fontSize: 26,
              color: '#6b7280',
              marginTop: 14,
            }}
          >
            {property.city}
          </div>
          <div
            style={{
              width: 72,
              height: 3,
              backgroundColor: '#a16207',
              marginTop: 26,
            }}
          />

          <div style={{ display: 'flex', gap: 40, marginTop: 34 }}>
            {[
              { value: property.bedrooms, label: 'Beds' },
              { value: property.bathrooms, label: 'Baths' },
              property.sqft ? { value: property.sqft, label: 'Sq Ft' } : null,
            ]
              .filter(Boolean)
              .map((s: any) => (
                <div key={s.label}>
                  <div
                    style={{
                      fontFamily: playfairDisplay.fontFamily,
                      fontWeight: 700,
                      fontSize: 46,
                      color: '#111827',
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
                      color: '#9ca3af',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      marginTop: 6,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div>
          <div
            style={{
              width: '100%',
              height: 1,
              backgroundColor: '#e5e7eb',
              marginBottom: 28,
            }}
          />
          <div>
            <div
              style={{
                width: 144,
                height: 144,
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: '#f3f4f6',
                border: '2px solid #a16207',
              }}
            >
              <Img
                src={realtor.headshotUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ marginTop: 18 }}>
              <div
                style={{
                  fontFamily: inter.fontFamily,
                  fontWeight: 700,
                  fontSize: 44,
                  color: '#111827',
                }}
              >
                {realtor.name}
              </div>
              <div
                style={{
                  fontFamily: inter.fontFamily,
                  fontWeight: 700,
                  fontSize: 52,
                  color: '#a16207',
                }}
              >
                {realtor.phone}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 22 }}>
            <Img
              src={realtor.logoUrl}
              style={{ height: 104, maxWidth: 520, objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SlideshowH1: React.FC<SlideshowProps> = ({
  images,
  property,
  realtor,
  musicTrackUrl,
}) => {
  const sceneImages = [0, 1, 2, 3, 4].map(
    (i) => images[Math.min(i, images.length - 1)] ?? ''
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#111827' }}>
      {sceneImages.map((src, i) => (
        <Sequence key={i} from={i * SCENE} durationInFrames={SCENE} layout="none">
          <PanelScene src={src} />
        </Sequence>
      ))}

      <InfoPanel property={property} realtor={realtor} />

      <MusicOverlay src={musicTrackUrl} volume={0.8} fadeInFrames={15} fadeOutFrames={30} />
    </AbsoluteFill>
  );
};
