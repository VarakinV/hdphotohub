import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  useCurrentFrame,
  Easing,
} from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import type { ReelProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { ptSans, sourceSerifPro, bebasNeue } from '../../lib/fonts';

export const REEL_V15_DURATION = 300; // 10s @ 30fps

const WHITE = '#ffffff';
const BG_VIDEO_URL =
  'https://photos4remedia.s3.ca-central-1.amazonaws.com/shotstack-templates/blue-green-wavy-bg.mp4';

const IMG_WIDTH = 600;
const IMG_HEIGHT = 400;
const BORDER_WIDTH = 5;

const IMAGES = [
  { x: 200, y: 350, rotate: -10, from: 60, duration: 240 },
  { x: 50, y: 650, rotate: 10, from: 120, duration: 180 },
  { x: 200, y: 1000, rotate: -10, from: 180, duration: 120 },
];

const easeOutCubic = Easing.bezier(0.33, 1, 0.67, 1);

const Background: React.FC = () => {
  return (
    <>
      <OffthreadVideo
        src={BG_VIDEO_URL}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1080,
          height: 1920,
          objectFit: 'cover',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

const RotatingImage: React.FC<{
  src: string;
  x: number;
  y: number;
  rotate: number;
}> = ({ src, x, y, rotate }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutCubic,
  });
  const scale = interpolate(frame, [0, 20], [0.92, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutCubic,
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 800,
        height: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        zIndex: 5,
      }}
    >
      <CameraMotionBlur samples={4} shutterAngle={180}>
        <div
          style={{
            width: IMG_WIDTH,
            height: IMG_HEIGHT,
            border: `${BORDER_WIDTH}px solid ${WHITE}`,
            boxSizing: 'border-box',
            transform: `rotate(${rotate}deg) scale(${scale})`,
            transformOrigin: 'center center',
            overflow: 'hidden',
          }}
        >
          <Img
            src={src}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      </CameraMotionBlur>
    </div>
  );
};

const TextOverlay: React.FC<{
  property: ReelProps['property'];
  realtor: ReelProps['realtor'];
}> = ({ property, realtor }) => {
  const streetLine =
    property.street?.trim() ||
    property.address.split(',')[0]?.trim() ||
    property.address;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: WHITE,
          fontFamily: bebasNeue.fontFamily,
          fontSize: 92,
          fontWeight: 400,
          letterSpacing: '0.08em',
          lineHeight: 1,
          textShadow: '0 2px 10px rgba(0,0,0,0.4)',
        }}
      >
        NEW LISTING
      </div>

      <div
        style={{
          position: 'absolute',
          top: 205,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: WHITE,
          fontFamily: ptSans.fontFamily,
          fontSize: 42,
          fontWeight: 400,
          letterSpacing: '0.3em',
          lineHeight: 1.4,
          padding: '0 40px',
          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {streetLine}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 280,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: WHITE,
          fontFamily: ptSans.fontFamily,
          fontSize: 38,
          fontWeight: 400,
          letterSpacing: '0.25em',
          lineHeight: 1.3,
          padding: '0 40px',
          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {property.city}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 300,
          top: 1505,
          color: WHITE,
          fontFamily: ptSans.fontFamily,
          fontSize: 55,
          fontWeight: 400,
          lineHeight: 1.1,
          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          whiteSpace: 'nowrap',
        }}
      >
        {realtor.name}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 300,
          top: 1595,
          color: WHITE,
          fontFamily: sourceSerifPro.fontFamily,
          fontSize: 68,
          fontWeight: 700,
          lineHeight: 1,
          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          whiteSpace: 'nowrap',
        }}
      >
        {realtor.phone}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 102,
          top: 1467,
          width: 196,
          height: 196,
          borderRadius: '50%',
          border: `8px solid ${WHITE}`,
          overflow: 'hidden',
          boxShadow: '0 0 20px rgba(0,0,0,0.2)',
          backgroundColor: WHITE,
        }}
      >
        <Img
          src={realtor.headshotUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      <Img
        src={realtor.logoUrl}
        style={{
          position: 'absolute',
          left: 795,
          top: 1680,
          width: 200,
          height: 80,
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

export const ReelV15: React.FC<ReelProps> = ({
  images,
  property,
  realtor,
  musicTrackUrl,
}) => {
  const imageSources = [0, 1, 2].map((i) => images[Math.min(i, images.length - 1)] ?? '');

  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      <Background />

      {IMAGES.map((config, i) => (
        <Sequence
          key={i}
          from={config.from}
          durationInFrames={config.duration}
          layout="none"
        >
          <RotatingImage
            src={imageSources[i]}
            x={config.x}
            y={config.y}
            rotate={config.rotate}
          />
        </Sequence>
      ))}

      <TextOverlay property={property} realtor={realtor} />

      <MusicOverlay
        src={musicTrackUrl}
        volume={0.8}
        fadeInFrames={15}
        fadeOutFrames={30}
      />
    </AbsoluteFill>
  );
};
