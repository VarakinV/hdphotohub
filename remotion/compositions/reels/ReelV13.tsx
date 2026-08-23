import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  Easing,
  Sequence,
} from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import type { ReelProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { inter, ptSans, grapeNuts } from '../../lib/fonts';

export const REEL_V13_DURATION = 525; // 17.5s @ 30fps (5 scenes × 3.5s)
const SCENE_DURATION = 105; // 3.5s @ 30fps

const WHITE = '#ffffff';
const BLACK = '#000000';
const OVERLAY_URL =
  'https://photos4remedia.s3.ca-central-1.amazonaws.com/shotstack-templates/angled-overlay-white.png';

const fadeInOut = (frame: number, duration: number, fadeFrames = 15) => {
  const fadeIn = interpolate(frame, [0, fadeFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const fadeOut = interpolate(
    frame,
    [duration - fadeFrames, duration],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  return Math.min(fadeIn, fadeOut);
};

type PanDirection = 'right' | 'bottom-left' | 'bottom' | 'top-left';

const getPanTransform = (direction: PanDirection, progress: number) => {
  const max = 70;
  switch (direction) {
    case 'right':
      return { x: -max * progress, y: 0 };
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
          top: 360,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 3000,
          height: 1200,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <CameraMotionBlur samples={4} shutterAngle={180}>
          <Img
            src={src}
            style={{
              height: '100%',
              width: 'auto',
              transform: `scale(${scale}) translate(${x}px, ${y}px)`,
            }}
          />
        </CameraMotionBlur>
      </div>
    </AbsoluteFill>
  );
};

const AngledOverlay: React.FC = () => {
  return (
    <Img
      src={OVERLAY_URL}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1080,
        height: 1920,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    />
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
          top: 159,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: BLACK,
          fontFamily: inter.fontFamily,
          fontSize: 108,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '0.02em',
        }}
      >
        For Sale
      </div>
      <div
        style={{
          position: 'absolute',
          top: 321,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: BLACK,
          fontFamily: ptSans.fontFamily,
          fontSize: 54,
          fontWeight: 400,
          letterSpacing: '0.3em',
          lineHeight: 1.4,
          padding: '0 40px',
        }}
      >
        {property.street?.trim() ||
          property.address.split(',')[0]?.trim() ||
          property.address}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 426,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: BLACK,
          fontFamily: ptSans.fontFamily,
          fontSize: 43,
          fontWeight: 400,
          letterSpacing: '0.25em',
          lineHeight: 1.3,
          padding: '0 40px',
        }}
      >
        {property.city}
      </div>
    </div>
  );
};

const AgentBlock: React.FC<{ realtor: ReelProps['realtor'] }> = ({
  realtor,
}) => {
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
          top: 1342,
          left: 791,
          width: 200,
          height: 200,
          overflow: 'hidden',
          backgroundColor: WHITE,
        }}
      >
        <Img
          src={realtor.headshotUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1639,
          left: 745,
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          fontFamily: inter.fontFamily,
          fontSize: 59,
          fontWeight: 600,
          color: BLACK,
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
        }}
      >
        {realtor.name}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1761,
          left: 747,
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          fontFamily: grapeNuts.fontFamily,
          fontSize: 76,
          color: BLACK,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {realtor.phone}
      </div>
      <Img
        src={realtor.logoUrl}
        style={{
          position: 'absolute',
          top: 1726,
          left: 64,
          width: 342,
          height: 125,
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

export const ReelV13: React.FC<ReelProps> = ({
  images,
  property,
  realtor,
  musicTrackUrl,
}) => {
  const sceneImages = [0, 1, 2, 3, 4].map(
    (i) => images[i % images.length] ?? ''
  );

  const directions: PanDirection[] = [
    'right',
    'bottom-left',
    'bottom',
    'top-left',
    'right',
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: WHITE }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Sequence
          key={i}
          from={i * SCENE_DURATION}
          durationInFrames={SCENE_DURATION}
          layout="none"
        >
          <SceneImage src={sceneImages[i]} direction={directions[i]} />
        </Sequence>
      ))}

      <AngledOverlay />
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
