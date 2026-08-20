import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  Easing,
  Sequence,
} from 'remotion';
import type { ReelProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { inter, ptSans, grapeNuts } from '../../lib/fonts';

export const REEL_V12_DURATION = 360; // 12s @ 30fps (4 scenes × 3s)
const SCENE_DURATION = 90;

const WHITE = '#ffffff';
const BLACK = '#000000';

const fadeInOut = (frame: number, duration: number, fadeFrames = 15) => {
  const fadeIn = interpolate(frame, [0, fadeFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const fadeOut = interpolate(frame, [duration - fadeFrames, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return Math.min(fadeIn, fadeOut);
};

type PanDirection = 'bottom-right' | 'bottom-left' | 'bottom' | 'top-left';

const getPanTransform = (direction: PanDirection, progress: number) => {
  const max = 70;
  switch (direction) {
    case 'bottom-right':
      return { x: -max * progress, y: -max * progress };
    case 'bottom-left':
      return { x: max * progress, y: -max * progress };
    case 'bottom':
      return { x: 0, y: -max * progress };
    case 'top-left':
      return { x: max * progress, y: max * progress };
    default:
      return { x: 0, y: 0 };
  }
};

const SceneImage: React.FC<{ src: string; direction: PanDirection }> = ({
  src,
  direction,
}) => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, SCENE_DURATION);

  const scale = interpolate(frame, [0, SCENE_DURATION], [1, 1.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const { x, y } = getPanTransform(
    direction,
    interpolate(frame, [0, SCENE_DURATION], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  return (
    <AbsoluteFill style={{ opacity, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 3000,
          height: 1200,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Img
          src={src}
          style={{
            height: '100%',
            width: 'auto',
            transform: `scale(${scale}) translate(${x}px, ${y}px)`,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

const VCutOverlay: React.FC = () => {
  return (
    <svg
      width="1080"
      height="1920"
      viewBox="0 0 1080 1920"
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}
    >
      <polygon points="0,860 0,1920 1080,1920 1080,860 540,1117" fill={WHITE} />
    </svg>
  );
};

const TopTextOverlay: React.FC<{ property: ReelProps['property'] }> = ({
  property,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 155,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: WHITE,
          fontFamily: inter.fontFamily,
          fontSize: 86,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}
      >
        FOR SALE
      </div>
      <div
        style={{
          position: 'absolute',
          top: 269,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: WHITE,
          fontFamily: ptSans.fontFamily,
          fontSize: 54,
          fontWeight: 400,
          letterSpacing: '0.35em',
          lineHeight: 1.3,
          textTransform: 'uppercase',
          padding: '0 40px',
        }}
      >
        {property.street?.trim() || property.address.split(',')[0]?.trim() || property.address}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 431,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: WHITE,
          fontFamily: ptSans.fontFamily,
          fontSize: 43,
          fontWeight: 400,
          letterSpacing: '0.3em',
          lineHeight: 1.3,
          textTransform: 'uppercase',
          padding: '0 40px',
        }}
      >
        {property.city}
      </div>
    </div>
  );
};

const AgentBlock: React.FC<{ realtor: ReelProps['realtor'] }> = ({ realtor }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        opacity,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 900,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 360,
          height: 360,
          backgroundColor: WHITE,
          overflow: 'hidden',
        }}
      >
        <Img
          src={realtor.headshotUrl}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1310,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: inter.fontFamily,
          fontSize: 59,
          fontWeight: 600,
          color: BLACK,
          lineHeight: 1.1,
        }}
      >
        {realtor.name}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1447,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: grapeNuts.fontFamily,
          fontSize: 130,
          color: BLACK,
          lineHeight: 1,
        }}
      >
        {realtor.phone}
      </div>
      <Img
        src={realtor.logoUrl}
        style={{
          position: 'absolute',
          top: 1620,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 250,
          height: 250,
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

export const ReelV12: React.FC<ReelProps> = ({
  images,
  property,
  realtor,
  musicTrackUrl,
}) => {
  const sceneImages = [0, 1, 2, 3].map(
    (i) => images[i % images.length] ?? ''
  );

  const directions: PanDirection[] = [
    'bottom-right',
    'bottom-left',
    'bottom',
    'top-left',
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: WHITE }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Sequence
          key={i}
          from={i * SCENE_DURATION}
          durationInFrames={SCENE_DURATION}
          layout="none"
        >
          <SceneImage src={sceneImages[i]} direction={directions[i]} />
        </Sequence>
      ))}

      <VCutOverlay />
      <TopTextOverlay property={property} />
      <AgentBlock realtor={realtor} />

      <MusicOverlay
        src={musicTrackUrl}
        volume={0.8}
        fadeInFrames={15}
        fadeOutFrames={30}
      />
    </AbsoluteFill>
  );
};
