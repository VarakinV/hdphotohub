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
import { sourceSerifPro, inter, bebasNeue, grapeNuts } from '../../lib/fonts';
import { formatStat } from '../../lib/format';

export const REEL_V11_DURATION = 495; // 16.5s @ 30fps (4s + 4s + 4s + 4.5s)
const SCENE1_DURATION = 120;
const SCENE2_DURATION = 120;
const SCENE3_DURATION = 120;
const SCENE4_DURATION = 135;

const RED = '#ff004c';
const WHITE = '#ffffff';
const BLACK = '#000000';
const GRAY_BORDER = '#d9d9d9';
const INNER_BORDER = '#bfbfbf';

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

const Scene1Image: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, SCENE1_DURATION);

  // Slow Ken Burns zoom + pan bottom-right
  const scale = interpolate(frame, [0, SCENE1_DURATION], [1, 1.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateX = interpolate(frame, [0, SCENE1_DURATION], [0, -60], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, SCENE1_DURATION], [0, -60], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity, overflow: 'hidden' }}>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.25) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

const ForSaleBanner: React.FC<{ property: ReelProps['property'] }> = ({ property }) => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, SCENE1_DURATION, 12);

  return (
    <div
      style={{
        position: 'absolute',
        top: 260,
        left: 340,
        width: 400,
        height: 800,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        border: `4px solid ${GRAY_BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        opacity,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 15,
          left: 15,
          right: 15,
          bottom: 15,
          border: `1px solid ${INNER_BORDER}`,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontFamily: sourceSerifPro.fontFamily,
            fontSize: 28,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#333',
            marginBottom: 20,
          }}
        >
          FOR
        </div>
        <div
          style={{
            fontFamily: sourceSerifPro.fontFamily,
            fontSize: 190,
            lineHeight: 1,
            fontWeight: 400,
            letterSpacing: '0.04em',
            color: '#333',
          }}
        >
          SA
        </div>
        <div
          style={{
            fontFamily: sourceSerifPro.fontFamily,
            fontSize: 190,
            lineHeight: 1,
            fontWeight: 400,
            letterSpacing: '0.04em',
            color: '#333',
          }}
        >
          LE
        </div>
      </div>
      <div
        style={{
          fontFamily: inter.fontFamily,
          fontSize: 28,
          fontWeight: 600,
          color: '#1a1a1a',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          lineHeight: 1.4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {property.street?.trim() || property.address.split(',')[0]?.trim() || property.address}
        <br />
        {property.city}
      </div>
    </div>
  );
};

const PolaroidPhoto: React.FC<{
  src: string;
  finalLeft: number;
  finalTop: number;
  finalRotate: number;
  delayFrames?: number;
}> = ({ src, finalLeft, finalTop, finalRotate, delayFrames = 0 }) => {
  const frame = useCurrentFrame();
  const duration = 45; // 1.5s easeOutCubic

  const progress = interpolate(
    frame,
    [delayFrames, delayFrames + duration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );

  const left = interpolate(progress, [0, 1], [1080, finalLeft], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const top = interpolate(progress, [0, 1], [1920, finalTop], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rotate = interpolate(progress, [0, 1], [30, finalRotate], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(progress, [0, 0.2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: 560,
        height: 660,
        padding: 14,
        paddingBottom: 56,
        backgroundColor: WHITE,
        borderRadius: 8,
        transform: `rotate(${rotate}deg)`,
        opacity,
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 4,
        }}
      />
    </div>
  );
};

const PhoneBlock: React.FC<{ phone: string }> = ({ phone }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
      <div style={{ width: 20, height: 260, backgroundColor: RED, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: 560 }}>
        <div style={{ width: '100%', height: 2, backgroundColor: WHITE }} />
        <div
          style={{
            fontFamily: bebasNeue.fontFamily,
            fontSize: 84,
            color: WHITE,
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}
        >
          {phone}
        </div>
        <div style={{ width: '100%', height: 2, backgroundColor: WHITE }} />
      </div>
    </div>
  );
};

const StatPhoneBlock: React.FC<{
  label: string;
  value: string | number;
  phone: string;
}> = ({ label, value, phone }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
      <div style={{ width: 20, height: 260, backgroundColor: RED, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 560 }}>
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontSize: 64,
            fontWeight: 800,
            color: WHITE,
            textTransform: 'capitalize',
            lineHeight: 1,
          }}
        >
          {formatStat(value)} {label}
        </div>
        <div style={{ width: '100%', height: 2, backgroundColor: WHITE }} />
        <div
          style={{
            fontFamily: bebasNeue.fontFamily,
            fontSize: 84,
            color: WHITE,
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}
        >
          {phone}
        </div>
        <div style={{ width: '100%', height: 2, backgroundColor: WHITE }} />
      </div>
    </div>
  );
};

const AgentCard: React.FC<{ realtor: ReelProps['realtor'] }> = ({ realtor }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        width: 260,
      }}
    >
      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: '50%',
          border: `8px solid ${WHITE}`,
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
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
          fontFamily: inter.fontFamily,
          fontSize: 32,
          fontWeight: 600,
          color: WHITE,
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {realtor.name}
      </div>
      <Img
        src={realtor.logoUrl}
        style={{ width: 220, height: 90, objectFit: 'contain', marginTop: 4 }}
      />
    </div>
  );
};

const PersistentOverlay: React.FC<{
  realtor: ReelProps['realtor'];
  phone: string;
  stat?: { label: string; value: string | number } | null;
}> = ({ realtor, phone, stat }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      style={{
        opacity,
        pointerEvents: 'none',
        textShadow: '0 2px 12px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ position: 'absolute', left: 60, top: 1390 }}>
        {stat ? (
          <StatPhoneBlock label={stat.label} value={stat.value} phone={phone} />
        ) : (
          <PhoneBlock phone={phone} />
        )}
      </div>
      <div style={{ position: 'absolute', right: 60, top: 1350 }}>
        <AgentCard realtor={realtor} />
      </div>
    </AbsoluteFill>
  );
};

const Scene2: React.FC<{
  leftSrc: string;
  rightSrc: string;
  property: ReelProps['property'];
  phone: string;
  realtor: ReelProps['realtor'];
}> = ({ leftSrc, rightSrc, property, phone, realtor }) => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, SCENE2_DURATION);

  return (
    <AbsoluteFill style={{ backgroundColor: BLACK, opacity }}>
      <PolaroidPhoto
        src={leftSrc}
        finalLeft={40}
        finalTop={80}
        finalRotate={-18}
        delayFrames={0}
      />
      <PolaroidPhoto
        src={rightSrc}
        finalLeft={470}
        finalTop={180}
        finalRotate={8}
        delayFrames={6}
      />
      <PersistentOverlay
        realtor={realtor}
        phone={phone}
        stat={{ label: 'Bed', value: property.bedrooms }}
      />
    </AbsoluteFill>
  );
};

const Scene3: React.FC<{
  leftSrc: string;
  rightSrc: string;
  property: ReelProps['property'];
  phone: string;
  realtor: ReelProps['realtor'];
}> = ({ leftSrc, rightSrc, property, phone, realtor }) => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, SCENE3_DURATION);

  return (
    <AbsoluteFill style={{ backgroundColor: BLACK, opacity }}>
      <PolaroidPhoto
        src={leftSrc}
        finalLeft={40}
        finalTop={80}
        finalRotate={-18}
        delayFrames={0}
      />
      <PolaroidPhoto
        src={rightSrc}
        finalLeft={470}
        finalTop={180}
        finalRotate={8}
        delayFrames={6}
      />
      <PersistentOverlay
        realtor={realtor}
        phone={phone}
        stat={{ label: 'Bath', value: property.bathrooms }}
      />
    </AbsoluteFill>
  );
};

const Scene4: React.FC<{
  src: string;
  phone: string;
  realtor: ReelProps['realtor'];
}> = ({ src, phone, realtor }) => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, SCENE4_DURATION);

  const scale = interpolate(frame, [0, SCENE4_DURATION], [1, 1.25], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BLACK, opacity }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1080,
          height: 800,
          overflow: 'hidden',
        }}
      >
        <Img
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 900,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: grapeNuts.fontFamily,
            fontSize: 150,
            color: WHITE,
            lineHeight: 1,
          }}
        >
          CALL
        </div>
      </div>
      <PersistentOverlay realtor={realtor} phone={phone} />
    </AbsoluteFill>
  );
};

export const ReelV11: React.FC<ReelProps> = ({
  images,
  property,
  realtor,
  musicTrackUrl,
}) => {
  // Cycle through available images if fewer than 6 provided.
  const sceneImages = [0, 1, 2, 3, 4, 5].map(
    (i) => images[i % images.length] ?? ''
  );

  return (
    <AbsoluteFill style={{ backgroundColor: BLACK }}>
      <Sequence from={0} durationInFrames={SCENE1_DURATION} layout="none">
        <Scene1Image src={sceneImages[0]} />
        <ForSaleBanner property={property} />
        <PersistentOverlay realtor={realtor} phone={realtor.phone} />
      </Sequence>

      <Sequence from={SCENE1_DURATION} durationInFrames={SCENE2_DURATION} layout="none">
        <Scene2
          leftSrc={sceneImages[1]}
          rightSrc={sceneImages[2]}
          property={property}
          phone={realtor.phone}
          realtor={realtor}
        />
      </Sequence>

      <Sequence
        from={SCENE1_DURATION + SCENE2_DURATION}
        durationInFrames={SCENE3_DURATION}
        layout="none"
      >
        <Scene3
          leftSrc={sceneImages[3]}
          rightSrc={sceneImages[4]}
          property={property}
          phone={realtor.phone}
          realtor={realtor}
        />
      </Sequence>

      <Sequence
        from={SCENE1_DURATION + SCENE2_DURATION + SCENE3_DURATION}
        durationInFrames={SCENE4_DURATION}
        layout="none"
      >
        <Scene4 src={sceneImages[5]} phone={realtor.phone} realtor={realtor} />
      </Sequence>

      <MusicOverlay
        src={musicTrackUrl}
        volume={0.8}
        fadeInFrames={15}
        fadeOutFrames={30}
      />
    </AbsoluteFill>
  );
};
