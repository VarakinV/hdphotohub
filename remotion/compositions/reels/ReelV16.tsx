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
import { ptSans, sourceSerifPro, bebasNeue, inter } from '../../lib/fonts';

export const REEL_V16_DURATION = 300; // 10s @ 30fps

const WHITE = '#ffffff';
const BLACK = '#000000';
const BG_VIDEO_URL =
  'https://photos4remedia.s3.ca-central-1.amazonaws.com/shotstack-templates/light-blue-waves-bg.mp4';

const IMAGES = [
  { from: 0, duration: 120 },
  { from: 120, duration: 90 },
  { from: 210, duration: 90 },
];

const easeLinear = Easing.linear;

const Background: React.FC = () => {
  return (
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
  );
};

const HeroImage: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, IMAGES[0].duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeLinear,
  });

  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 1, 0.67, 1),
  });

  const scale = 1 + progress * 0.12;
  const x = -progress * 20;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1080,
        height: 800,
        overflow: 'hidden',
        opacity,
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
      }}
    >
      <CameraMotionBlur samples={4} shutterAngle={180}>
        <Img
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${scale}) translateX(${x}px)`,
            transformOrigin: 'center center',
          }}
        />
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
          top: 80,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: WHITE,
          fontFamily: bebasNeue.fontFamily,
          fontSize: 92,
          fontWeight: 400,
          letterSpacing: '0.08em',
          lineHeight: 1,
          textShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}
      >
        FOR SALE
      </div>

      <div
        style={{
          position: 'absolute',
          left: 365,
          top: 625,
          width: 350,
          height: 350,
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

      <div
        style={{
          position: 'absolute',
          top: 1030,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: BLACK,
          fontFamily: inter.fontFamily,
          fontSize: 62,
          fontWeight: 500,
          lineHeight: 1.1,
          textShadow: '0 1px 4px rgba(255,255,255,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        {realtor.name}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 1130,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: BLACK,
          fontFamily: sourceSerifPro.fontFamily,
          fontSize: 74,
          fontWeight: 700,
          lineHeight: 1,
          textShadow: '0 1px 4px rgba(255,255,255,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        {realtor.phone}
      </div>

      <Img
        src={realtor.logoUrl}
        style={{
          position: 'absolute',
          left: 369,
          top: 1300,
          width: 342,
          height: 125,
          objectFit: 'contain',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 1480,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: BLACK,
          fontFamily: ptSans.fontFamily,
          fontSize: 45,
          fontWeight: 400,
          letterSpacing: '0.3em',
          lineHeight: 1.4,
          padding: '0 40px',
          textShadow: '0 1px 4px rgba(255,255,255,0.5)',
        }}
      >
        {streetLine}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 1590,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: BLACK,
          fontFamily: ptSans.fontFamily,
          fontSize: 40,
          fontWeight: 400,
          letterSpacing: '0.25em',
          lineHeight: 1.3,
          padding: '0 40px',
          textShadow: '0 1px 4px rgba(255,255,255,0.5)',
        }}
      >
        {property.city}
      </div>
    </div>
  );
};

export const ReelV16: React.FC<ReelProps> = ({
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
          <HeroImage src={imageSources[i]} />
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
