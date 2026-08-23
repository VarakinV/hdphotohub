import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  Easing,
  Sequence,
  OffthreadVideo,
} from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import type { ReelProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { sourceSerifPro, anton, bebasNeue, inter } from '../../lib/fonts';

export const REEL_V10_DURATION = 480; // 16s @ 30fps
const SCENE_DURATION = 120; // 4s @ 30fps

const BG_VIDEO_URL =
  'https://photos4remedia.s3.ca-central-1.amazonaws.com/orders/reels-assets/Blue-Circle-Bg-Video-h264.mp4';

// Helpers
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

const BackgroundVideo: React.FC = () => (
  <OffthreadVideo
    src={BG_VIDEO_URL}
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    }}
  />
);

const Scene1Image: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const progress = frame / SCENE_DURATION;

  const opacity = fadeInOut(frame, SCENE_DURATION, 15);
  const scale = interpolate(progress, [0, 1], [1.12, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateX = interpolate(progress, [0, 1], [-80, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      <CameraMotionBlur samples={4} shutterAngle={180}>
        <Img
          src={src}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${scale}) translateX(${translateX}px)`,
          }}
        />
      </CameraMotionBlur>
      {/* Subtle dark gradient so text stays readable over any photo */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0) 65%)',
        }}
      />
    </AbsoluteFill>
  );
};

const StackedImage: React.FC<{ src: string; top: number }> = ({ src, top }) => {
  const frame = useCurrentFrame();
  const progress = frame / SCENE_DURATION;

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(progress, [0, 1], [1.08, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 90,
        width: 900,
        height: 506,
        border: '5px solid #ffffff',
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        opacity,
      }}
    >
      <CameraMotionBlur samples={4} shutterAngle={180}>
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
  );
};

const Scene2Images: React.FC<{ topSrc: string; bottomSrc: string }> = ({
  topSrc,
  bottomSrc,
}) => (
  <AbsoluteFill>
    <StackedImage src={topSrc} top={550} />
    <StackedImage src={bottomSrc} top={1170} />
  </AbsoluteFill>
);

const Scene3Images: React.FC<{ topSrc: string; bottomSrc: string }> = ({
  topSrc,
  bottomSrc,
}) => (
  <AbsoluteFill>
    <StackedImage src={topSrc} top={550} />
    <StackedImage src={bottomSrc} top={1170} />
  </AbsoluteFill>
);

const AgentScene: React.FC<{ realtor: ReelProps['realtor'] }> = ({ realtor }) => {
  const frame = useCurrentFrame();

  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const logoY = interpolate(frame, [0, 20], [-40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const headshotScale = interpolate(frame, [15, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const nameOpacity = interpolate(frame, [30, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const nameY = interpolate(frame, [30, 55], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const line1Scale = interpolate(frame, [45, 75], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const phoneOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const phoneY = interpolate(frame, [60, 90], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const line2Scale = interpolate(frame, [75, 105], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill>
      {/* Logo */}
      <div
        style={{
          position: 'absolute',
          top: 300,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: logoOpacity,
          transform: `translateY(${logoY}px)`,
        }}
      >
        <Img
          src={realtor.logoUrl}
          style={{ width: 300, height: 140, objectFit: 'contain' }}
        />
      </div>

      {/* Headshot */}
      <div
        style={{
          position: 'absolute',
          top: 480,
          left: '50%',
          width: 400,
          height: 400,
          marginLeft: -200,
          borderRadius: '50%',
          border: '8px solid #ffffff',
          overflow: 'hidden',
          boxShadow: '0 12px 50px rgba(0,0,0,0.4)',
          transform: `scale(${headshotScale})`,
          transformOrigin: 'center center',
        }}
      >
        <Img
          src={realtor.headshotUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Name */}
      <div
        style={{
          position: 'absolute',
          top: 920,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: nameOpacity,
          transform: `translateY(${nameY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 600,
            fontSize: 52,
            color: '#ffffff',
            letterSpacing: '0.02em',
          }}
        >
          {realtor.name}
        </div>
      </div>

      {/* Line 1 */}
      <div
        style={{
          position: 'absolute',
          top: 995,
          left: '50%',
          width: 420,
          height: 2,
          marginLeft: -210,
          backgroundColor: '#ffffff',
          transform: `scaleX(${line1Scale})`,
          transformOrigin: 'center center',
        }}
      />

      {/* Phone */}
      <div
        style={{
          position: 'absolute',
          top: 1035,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: phoneOpacity,
          transform: `translateY(${phoneY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: bebasNeue.fontFamily,
            fontWeight: 400,
            fontSize: 88,
            color: '#ffffff',
            letterSpacing: '0.06em',
            lineHeight: 1,
          }}
        >
          {realtor.phone}
        </div>
      </div>

      {/* Line 2 */}
      <div
        style={{
          position: 'absolute',
          top: 1150,
          left: '50%',
          width: 420,
          height: 2,
          marginLeft: -210,
          backgroundColor: '#ffffff',
          transform: `scaleX(${line2Scale})`,
          transformOrigin: 'center center',
        }}
      />
    </AbsoluteFill>
  );
};

const PersistentText: React.FC<{ property: ReelProps['property'] }> = ({ property }) => {
  const frame = useCurrentFrame();
  const displayStreet =
    property.street?.trim() || property.address.split(',')[0]?.trim() || property.address;

  const titleOpacity = Math.min(
    interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    interpolate(frame, [345, 360], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  );

  const addressOpacity = Math.min(
    interpolate(frame, [30, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    interpolate(frame, [345, 360], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  );

  const cityOpacity = Math.min(
    interpolate(frame, [60, 75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    interpolate(frame, [345, 360], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  );

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: 130,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontFamily: sourceSerifPro.fontFamily,
            fontWeight: 700,
            fontSize: 80,
            color: '#ffffff',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            lineHeight: 1,
            textShadow: '0 2px 24px rgba(0,0,0,0.35)',
          }}
        >
          Just Listed
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 220,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: addressOpacity,
          padding: '0 60px',
        }}
      >
        <div
          style={{
            fontFamily: anton.fontFamily,
            fontWeight: 400,
            fontSize: 52,
            color: '#ffffff',
            letterSpacing: '0.02em',
            lineHeight: 1.1,
            textShadow: '0 2px 20px rgba(0,0,0,0.35)',
          }}
        >
          {displayStreet}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 290,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: cityOpacity,
        }}
      >
        <div
          style={{
            fontFamily: anton.fontFamily,
            fontWeight: 400,
            fontSize: 42,
            color: '#ffffff',
            letterSpacing: '0.04em',
            lineHeight: 1,
            textShadow: '0 2px 16px rgba(0,0,0,0.35)',
          }}
        >
          {property.city}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ReelV10: React.FC<ReelProps> = ({ images, property, realtor, musicTrackUrl }) => {
  const sceneImages = [0, 1, 2, 3, 4].map((i) => images[Math.min(i, images.length - 1)] ?? '');

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      <BackgroundVideo />

      <Sequence from={0} durationInFrames={SCENE_DURATION} layout="none">
        <Scene1Image src={sceneImages[0]} />
      </Sequence>

      <Sequence from={SCENE_DURATION} durationInFrames={SCENE_DURATION} layout="none">
        <Scene2Images topSrc={sceneImages[1]} bottomSrc={sceneImages[2]} />
      </Sequence>

      <Sequence from={SCENE_DURATION * 2} durationInFrames={SCENE_DURATION} layout="none">
        <Scene3Images topSrc={sceneImages[3]} bottomSrc={sceneImages[4]} />
      </Sequence>

      <Sequence from={SCENE_DURATION * 3} durationInFrames={SCENE_DURATION} layout="none">
        <AgentScene realtor={realtor} />
      </Sequence>

      <PersistentText property={property} />
      <MusicOverlay src={musicTrackUrl} volume={0.8} fadeInFrames={15} fadeOutFrames={30} />
    </AbsoluteFill>
  );
};
