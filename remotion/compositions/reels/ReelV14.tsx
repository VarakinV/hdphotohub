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
import { inter, ptSans, sourceSerifPro, bebasNeue } from '../../lib/fonts';

export const REEL_V14_DURATION = 330; // 11s @ 30fps
const PAIR_1_DURATION = 165; // 5.5s
const PAIR_2_DURATION = 165; // 5.5s
const SLIDE_FRAMES = 45; // 1.5s

const WHITE = '#ffffff';
const BG_VIDEO_URL =
  'https://photos4remedia.s3.ca-central-1.amazonaws.com/shotstack-templates/geometry-blue-lines-bg.mp4';

const IMG_WIDTH = 400;
const IMG_HEIGHT = 324;
const IMG_TOP = 583;
const IMG_LEFT_1 = 108;
const IMG_LEFT_2 = 594;
const IMG_LEFT_1_START = -324;
const IMG_LEFT_2_START = 1080;

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
    </>
  );
};

const SlidingImage: React.FC<{
  src: string;
  finalLeft: number;
  startLeft: number;
}> = ({ src, finalLeft, startLeft }) => {
  const frame = useCurrentFrame();
  const left = interpolate(
    frame,
    [0, SLIDE_FRAMES],
    [startLeft, finalLeft],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easeOutCubic,
    }
  );

  return (
    <CameraMotionBlur samples={8} shutterAngle={180}>
      <div
        style={{
          position: 'absolute',
          top: IMG_TOP,
          left,
          width: IMG_WIDTH,
          height: IMG_HEIGHT,
          border: '8px solid white',
          borderRadius: 6,
          overflow: 'hidden',
          boxSizing: 'border-box',
          zIndex: 5,
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
  );
};

const ImagePair: React.FC<{
  leftSrc: string;
  rightSrc: string;
}> = ({ leftSrc, rightSrc }) => {
  return (
    <>
      <SlidingImage src={leftSrc} finalLeft={IMG_LEFT_1} startLeft={IMG_LEFT_1_START} />
      <SlidingImage src={rightSrc} finalLeft={IMG_LEFT_2} startLeft={IMG_LEFT_2_START} />
    </>
  );
};

const TextOverlay: React.FC<{ property: ReelProps['property']; realtor: ReelProps['realtor'] }> = ({
  property,
  realtor,
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
          top: 220,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: WHITE,
          fontFamily: bebasNeue.fontFamily,
          fontSize: 97,
          fontWeight: 400,
          letterSpacing: '0.04em',
          lineHeight: 1,
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}
      >
        FOR SALE
      </div>
      <div
        style={{
          position: 'absolute',
          top: 338,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: WHITE,
          fontFamily: ptSans.fontFamily,
          fontSize: 49,
          fontWeight: 400,
          letterSpacing: '0.3em',
          lineHeight: 1.5,
          padding: '0 40px',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        {property.street?.trim() ||
          property.address.split(',')[0]?.trim() ||
          property.address}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 436,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: WHITE,
          fontFamily: ptSans.fontFamily,
          fontSize: 43,
          fontWeight: 400,
          letterSpacing: '0.25em',
          lineHeight: 1.3,
          padding: '0 40px',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        {property.city}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1536,
          left: 706,
          transform: 'translateX(-50%)',
          textAlign: 'center',
          color: WHITE,
          fontFamily: inter.fontFamily,
          fontSize: 65,
          fontWeight: 600,
          lineHeight: 1.1,
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        {realtor.name}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1669,
          left: 738,
          transform: 'translateX(-50%)',
          textAlign: 'center',
          color: WHITE,
          fontFamily: sourceSerifPro.fontFamily,
          fontSize: 76,
          fontWeight: 700,
          lineHeight: 1,
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        {realtor.phone}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1155,
          left: 668,
          width: 350,
          height: 350,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: '50%',
            border: '8px solid white',
            overflow: 'hidden',
            boxShadow: '0 0 20px rgba(0,0,0,0.2)',
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
      </div>
      <Img
        src={realtor.logoUrl}
        style={{
          position: 'absolute',
          top: 1650,
          left: 80,
          width: 342,
          height: 125,
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

export const ReelV14: React.FC<ReelProps> = ({
  images,
  property,
  realtor,
  musicTrackUrl,
}) => {
  const image1 = images[0] ?? '';
  const image2 = images[1] ?? '';
  const image3 = images[2] ?? '';
  const image4 = images[3] ?? '';

  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      <Background />

      <Sequence from={0} durationInFrames={PAIR_1_DURATION} layout="none">
        <ImagePair leftSrc={image1} rightSrc={image2} />
      </Sequence>
      <Sequence
        from={PAIR_1_DURATION}
        durationInFrames={PAIR_2_DURATION}
        layout="none"
      >
        <ImagePair leftSrc={image3} rightSrc={image4} />
      </Sequence>

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
