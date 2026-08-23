import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing, Sequence } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import type { ReelProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { ptSans, sourceSerifPro } from '../../lib/fonts';

const SCENE = 78; // 2.6s per scene at 30fps
const FADE = 15; // 0.5s fade in/out per scene
export const REEL_V1_DURATION = SCENE * 5; // 390 frames = 13s

const BG_URL =
  'https://photos4remedia.s3.ca-central-1.amazonaws.com/shotstack-templates/bb-for-reel-white-waves.jpg';

const SCENE_PANS: Array<{ x: [number, number]; y: [number, number] }> = [
  { x: [0, -55], y: [0, 0] }, // right
  { x: [55, 0], y: [55, 0] }, // bottom-left
  { x: [0, 0], y: [55, 0] }, // bottom
  { x: [55, 0], y: [-55, 0] }, // top-left
  { x: [0, -55], y: [0, 0] }, // right
];

const ComingSoonScene: React.FC<{
  src: string;
  pan: { x: [number, number]; y: [number, number] };
}> = ({ src, pan }) => {
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
  const translateX = interpolate(frame, [0, SCENE], pan.x);
  const translateY = interpolate(frame, [0, SCENE], pan.y);

  return (
    <AbsoluteFill>
      <CameraMotionBlur samples={8} shutterAngle={180}>
        <Img
          src={src}
          style={{
            position: 'absolute',
            left: 130,
            top: 420,
            width: 950,
            height: 670,
            objectFit: 'cover',
            opacity,
            transform: `scale(1.14) translate(${translateX}px, ${translateY}px)`,
          }}
        />
      </CameraMotionBlur>
    </AbsoluteFill>
  );
};

const VerticalComingSoon: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      left: 40,
      top: 60,
      bottom: 60,
      writingMode: 'vertical-rl',
      transform: 'rotate(180deg)',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontWeight: 700,
      fontSize: 66,
      letterSpacing: 40,
      textTransform: 'uppercase',
      color: '#000000',
      lineHeight: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    Coming Soon
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

  const cityLine = property.city;
  // Show only the street in line 1. Prefer the explicit street field, otherwise
  // fall back to the first comma-separated segment of the full address (handles
  // Canada, USA, Australia and other Google-formatted addresses).
  const streetLine =
    property.street?.trim() ||
    property.address.split(',')[0]?.trim() ||
    property.address;

  return (
    <AbsoluteFill>
      {/* Address + City — top center */}
      <div
        style={{
          position: 'absolute',
          top: 116,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: ptSans.fontFamily,
            fontWeight: 400,
            fontSize: 46,
            color: '#000000',
            lineHeight: 1.1,
            padding: '0 140px',
            letterSpacing: 6,
          }}
        >
          {streetLine}
        </div>
        <div
          style={{
            fontFamily: ptSans.fontFamily,
            fontWeight: 400,
            fontSize: 40,
            color: '#000000',
            lineHeight: 1.2,
            marginTop: 8,
            letterSpacing: 10,
          }}
        >
          {cityLine}
        </div>
      </div>

      {/* Agent name + phone — bottom center, constrained so long names wrap
          instead of sliding behind the circular headshot on the right. */}
      <div
        style={{
          position: 'absolute',
          bottom: 340,
          left: 64,
          right: 380,
          textAlign: 'center',
          opacity,
        }}
      >
        <div
          style={{
          fontFamily: ptSans.fontFamily,
          fontWeight: 700,
          fontSize: 64,
          color: '#000000',
          lineHeight: 1.1,
        }}
        >
          {realtor.name}
        </div>
        <div
          style={{
          fontFamily: sourceSerifPro.fontFamily,
          fontWeight: 700,
          fontSize: 76,
          color: '#000000',
          lineHeight: 1.1,
          marginTop: 8,
        }}
        >
          {realtor.phone}
        </div>
      </div>

      {/* Circular headshot — bottom right */}
      <div
        style={{
          position: 'absolute',
          right: 60,
          bottom: 380,
          width: 260,
          height: 260,
          borderRadius: '50%',
          border: '8px solid #ffffff',
          boxShadow: '0 0 24px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          opacity,
        }}
      >
        <Img
          src={realtor.headshotUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Brokerage logo — bottom left */}
      <div
        style={{
          position: 'absolute',
          left: 64,
          bottom: 69,
          opacity,
        }}
      >
        <Img
          src={realtor.logoUrl}
          style={{ width: 342, height: 125, objectFit: 'contain' }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const ReelV1: React.FC<ReelProps> = ({ images, property, realtor, musicTrackUrl }) => {
  const sceneImages = [0, 1, 2, 3, 4].map(
    (i) => images[Math.min(i, images.length - 1)] ?? ''
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#f4f4f4' }}>
      {/* Persistent white-waves background */}
      <Img
        src={BG_URL}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Property images — 5 sequential scenes, each with pan + fade in/out */}
      {sceneImages.map((src, i) => (
        <Sequence key={i} from={i * SCENE} durationInFrames={SCENE} layout="none">
          <ComingSoonScene src={src} pan={SCENE_PANS[i]} />
        </Sequence>
      ))}

      {/* Persistent overlay + vertical banner */}
      <OverlayElements property={property} realtor={realtor} />
      <VerticalComingSoon />

      <MusicOverlay src={musicTrackUrl} volume={0.8} fadeInFrames={15} fadeOutFrames={30} />
    </AbsoluteFill>
  );
};
