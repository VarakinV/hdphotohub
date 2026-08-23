import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing, Sequence } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import type { SlideshowProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { inter, lato, parisienne } from '../../lib/fonts';

// Horizontal Slideshow 4 — port of .examples/horizontal-slideshow-4-just-listed.json
// (Shotstack "Just Listed" template). Timeline @30fps:
//   intro 4.6s (138f) → 5 image scenes 3s each with pan + hrslice 0.5s in
//   → outro 5s (150f) with slideright reveal. Total 738f = 24.6s.
const INTRO = 138;
const SCENES: { dur: number; pan: Pan }[] = [
  { dur: 90, pan: 'left' }, // Image 2
  { dur: 90, pan: 'top' }, // Image 3
  { dur: 90, pan: 'top-left' }, // Image 4
  { dur: 90, pan: 'top-right' }, // Image 5
  { dur: 90, pan: 'bottom-right' }, // Image 6
];
const OUTRO = 150;
export const SLIDESHOW_H4_DURATION = INTRO + SCENES.reduce((a, s) => a + s.dur, 0) + OUTRO; // 738

const OVERLAY_END = INTRO + SCENES.reduce((a, s) => a + s.dur, 0); // 588 — intro + all slides

const SCENE_STOPS = (() => {
  const stops: number[] = [];
  let acc = INTRO;
  for (const s of SCENES) {
    stops.push(acc);
    acc += s.dur;
  }
  return stops;
})();
const OUTRO_START = SCENE_STOPS[SCENE_STOPS.length - 1] + SCENES[SCENES.length - 1].dur; // 588

const SLICE = 15; // hrslice transition, 0.5s
const BANDS = 6;
const BAND_H = 1080 / BANDS;
const PAN_ZOOM = 1.15;
const PAN_MOVE = 40;

type Pan = 'left' | 'top' | 'top-left' | 'top-right' | 'bottom-right';

function useImageSize(src: string): { w: number; h: number } {
  const [size, setSize] = React.useState({ w: 1920, h: 1280 });
  React.useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (alive) {
        setSize({ w: img.naturalWidth || 1920, h: img.naturalHeight || 1280 });
      }
    };
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);
  return size;
}

function panOffset(pan: Pan, t: number): { x: number; y: number } {
  switch (pan) {
    case 'left':
      return { x: -PAN_MOVE * t, y: 0 };
    case 'top':
      return { x: 0, y: -PAN_MOVE * t };
    case 'top-left':
      return { x: -PAN_MOVE * t, y: -PAN_MOVE * t };
    case 'top-right':
      return { x: PAN_MOVE * t, y: -PAN_MOVE * t };
    case 'bottom-right':
      return { x: PAN_MOVE * t, y: PAN_MOVE * t };
  }
}

const SliceScene: React.FC<{
  src: string;
  prevSrc?: string;
  pan: Pan;
  duration: number;
}> = ({ src, prevSrc, pan, duration }) => {
  const frame = useCurrentFrame();
  const { w, h } = useImageSize(src);
  const scale = Math.max(1920 / w, 1080 / h);
  const imgH = h * scale;
  const baseY = Math.max(0, (imgH - 1080) / 2);

  const sliceT = Math.min(frame / SLICE, 1);
  const conv = Easing.out(Easing.cubic)(sliceT);
  const panT = Easing.inOut(Easing.cubic)(
    Math.max(0, Math.min((frame - SLICE) / (duration - SLICE), 1))
  );
  const { x, y } = panOffset(pan, panT);

  return (
    <CameraMotionBlur samples={8} shutterAngle={180}>
      <AbsoluteFill
        style={{ transform: `scale(${PAN_ZOOM}) translate(${x}px, ${y}px)` }}
      >
        {prevSrc ? (
          <Img
            src={prevSrc}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}
        {Array.from({ length: BANDS }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: i * BAND_H,
              left: 0,
              width: '100%',
              height: BAND_H,
              transform: `translateY(${(i % 2 === 0 ? -1 : 1) * 80 * (1 - conv)}px)`,
              opacity: Math.min(frame / 8, 1),
            }}
          >
            <Img
              src={src}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: `center ${-(baseY + i * BAND_H)}px`,
              }}
            />
          </div>
        ))}
      </AbsoluteFill>
    </CameraMotionBlur>
  );
};

const IntroScene: React.FC<{
  src: string;
  property: SlideshowProps['property'];
}> = ({ src, property }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, INTRO], [1, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [0, 30], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const addressOpacity = interpolate(frame, [10, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      <CameraMotionBlur samples={8} shutterAngle={180}>
        <Img
          src={src}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${zoom}) translateY(-3px)`,
          }}
        />
      </CameraMotionBlur>
      <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} />
      <div
        style={{
          position: 'absolute',
          top: 170,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity,
          transform: `translateY(${rise}px)`,
        }}
      >
        <div
          style={{
            fontFamily: parisienne.fontFamily,
            fontWeight: 400,
            fontSize: 96,
            color: '#ffffff',
            textShadow: '5px 5px rgba(33,33,33,0.8)',
            lineHeight: 1.1,
          }}
        >
          Just Listed
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 480,
          left: '10%',
          right: '10%',
          textAlign: 'center',
          opacity: addressOpacity,
        }}
      >
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 400,
            fontSize: 58,
            color: '#ffffff',
            lineHeight: 1.15,
          }}
        >
          {property.street?.trim() || property.address.split(',')[0]?.trim() || property.address}
        </div>
        <div
          style={{
            fontFamily: lato.fontFamily,
            fontWeight: 300,
            fontSize: 38,
            color: '#cccccc',
            marginTop: 4,
          }}
        >
          {property.city}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const RealtorOverlay: React.FC<{ realtor: SlideshowProps['realtor'] }> = ({
  realtor,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        bottom: 140,
        display: 'flex',
        alignItems: 'center',
        gap: 25,
        opacity,
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '4px solid #ffffff',
        }}
      >
        <Img
          src={realtor.headshotUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          color: '#ffffff',
          fontFamily: inter.fontFamily,
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>
          {realtor.name}
        </div>
        <div style={{ fontSize: 26, fontWeight: 400, opacity: 0.9, marginTop: 2 }}>
          {realtor.phone}
        </div>
      </div>
    </div>
  );
};

const StatsOverlay: React.FC<{ property: SlideshowProps['property'] }> = ({
  property,
}) => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [OVERLAY_END - 15, OVERLAY_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const stats: { text: string; at: number; x: number }[] = [
    { text: `${property.bedrooms} Bed`, at: 78, x: 738 },
    { text: `${property.bathrooms} Bath`, at: 90, x: 1031 },
  ];
  if (property.sqft) stats.push({ text: `${property.sqft} SQFT`, at: 102, x: 1309 });

  return (
    <>
      {stats.map((s) => {
        const opacity = Math.min(
          fadeOut,
          interpolate(frame, [s.at, s.at + 12], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        );
        return (
          <div
            key={s.text}
            style={{
              position: 'absolute',
              top: 869,
              left: s.x,
              transform: 'translateX(-50%)',
              opacity,
              fontFamily: inter.fontFamily,
              fontWeight: 400,
              fontSize: 29,
              color: '#ffffff',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            {s.text}
          </div>
        );
      })}
    </>
  );
};

const GradientOverlay: React.FC = () => (
  <AbsoluteFill
    style={{
      background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
      pointerEvents: 'none',
    }}
  />
);

const WhiteBorderOverlay: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <div
      style={{
        position: 'absolute',
        top: 30,
        left: 30,
        right: 30,
        bottom: 30,
        borderWidth: 20,
        borderStyle: 'solid',
        borderColor: 'rgba(255,255,255,0.6)',
      }}
    />
  </AbsoluteFill>
);

const Polaroid: React.FC<{
  src: string;
  dx: number;
  dy: number;
  rot: number;
  opacity: number;
}> = ({ src, dx, dy, rot, opacity }) => (
  <div
    style={{
      position: 'absolute',
      left: 1951,
      top: 1082,
      width: 576,
      height: 576,
      transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`,
      borderWidth: '19px 19px 77px 19px',
      borderStyle: 'solid',
      borderColor: '#ffffff',
      borderRadius: 10,
      boxSizing: 'border-box',
      overflow: 'hidden',
      opacity,
    }}
  >
    <Img
      src={src}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  </div>
);

const OutroScene: React.FC<{
  prevSrc: string;
  realtor: SlideshowProps['realtor'];
  polaroidSrcs: [string, string];
}> = ({ prevSrc, realtor, polaroidSrcs }) => {
  const frame = useCurrentFrame();
  const slideT = Easing.inOut(Easing.cubic)(Math.min(frame / SLICE, 1));
  const contentOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const polT = Easing.out(Easing.cubic)(Math.min(frame / 45, 1));
  const polOpacity = Math.min(frame / 10, 1);

  const p1 = {
    src: polaroidSrcs[0],
    dx: interpolate(polT, [0, 1], [0, -848]),
    dy: interpolate(polT, [0, 1], [0, -755]),
    rot: interpolate(polT, [0, 1], [30, -30]),
  };
  const p2 = {
    src: polaroidSrcs[1],
    dx: interpolate(polT, [0, 1], [0, -530]),
    dy: interpolate(polT, [0, 1], [0, -755]),
    rot: interpolate(polT, [0, 1], [30, -5]),
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      <CameraMotionBlur samples={8} shutterAngle={180}>
        <AbsoluteFill>
          {frame < SLICE && (
            <Img
              src={prevSrc}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `translateX(${1920 * slideT}px)`,
              }}
            />
          )}
          <Polaroid {...p1} opacity={polOpacity} />
          <Polaroid {...p2} opacity={polOpacity} />
        </AbsoluteFill>
      </CameraMotionBlur>
      <div
        style={{
          position: 'absolute',
          left: 160,
          top: 340,
          width: 320,
          height: 320,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '8px solid #ffffff',
          opacity: contentOpacity,
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
          left: 185,
          top: 700,
          width: 20,
          height: 88,
          backgroundColor: '#e63946',
          opacity: contentOpacity,
        }}
      />
      <div style={{ position: 'absolute', left: 235, top: 688, opacity: contentOpacity }}>
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 700,
            fontSize: 64,
            color: '#ffffff',
            lineHeight: 1.1,
          }}
        >
          {realtor.name}
        </div>
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 400,
            fontSize: 40,
            color: '#ffffff',
            marginTop: 12,
          }}
        >
          {realtor.phone}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SlideshowH4: React.FC<SlideshowProps> = ({
  images,
  property,
  realtor,
  musicTrackUrl,
}) => {
  const sceneSrc = (i: number) => images[Math.min(i, images.length - 1)] ?? '';

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      <Sequence from={0} durationInFrames={INTRO} layout="none">
        <IntroScene src={images[0] ?? ''} property={property} />
      </Sequence>

      {SCENES.map((s, i) => (
        <Sequence
          key={i}
          from={SCENE_STOPS[i]}
          durationInFrames={s.dur}
          layout="none"
        >
          <SliceScene
            src={sceneSrc(i + 1)}
            prevSrc={sceneSrc(i)}
            pan={s.pan}
            duration={s.dur}
          />
        </Sequence>
      ))}

      <Sequence from={OUTRO_START} durationInFrames={OUTRO} layout="none">
        <OutroScene
          prevSrc={sceneSrc(SCENES.length)}
          realtor={realtor}
          polaroidSrcs={[sceneSrc(2), sceneSrc(3)]}
        />
      </Sequence>

      <GradientOverlay />

      <Sequence from={0} durationInFrames={OVERLAY_END} layout="none">
        <RealtorOverlay realtor={realtor} />
      </Sequence>

      <Sequence from={0} durationInFrames={OVERLAY_END} layout="none">
        <StatsOverlay property={property} />
      </Sequence>

      <div style={{ position: 'absolute', top: 750, left: 1600, width: 250, height: 250 }}>
        <Img
          src={realtor.logoUrl}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      <WhiteBorderOverlay />

      <MusicOverlay
        src={musicTrackUrl}
        volume={0.8}
        fadeInFrames={15}
        fadeOutFrames={30}
      />
    </AbsoluteFill>
  );
};
