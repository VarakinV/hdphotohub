import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing, Sequence } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import type { SlideshowProps } from '../../lib/types';
import { MusicOverlay } from '../shared';
import { inter } from '../../lib/fonts';
import { formatStat } from '../../lib/format';

// Horizontal Slideshow 3 — faithful port of .examples/horizontal-slideshow-3-for-sale.json
// (Shotstack template qm3cqo1f). Timeline @30fps (example video: 23.04s @25fps):
//   intro 2.8s (84f) → 5 image scenes 3/3/4/3/3s with pan + hrslice 0.5s in
//   → outro 4.2s (126f) with slideright reveal.  Total 690f = 23.0s.
const INTRO = 84;
const SCENES: { dur: number; pan: Pan }[] = [
  { dur: 90, pan: 'left' }, // Image 2
  { dur: 90, pan: 'top' }, // Image 3
  { dur: 120, pan: 'top-left' }, // Image 4
  { dur: 90, pan: 'top-right' }, // Image 5
  { dur: 90, pan: 'bottom-right' }, // Image 6
];
const OUTRO = 126;
export const SLIDESHOW_H3_DURATION = INTRO + SCENES.reduce((a, s) => a + s.dur, 0) + OUTRO; // 690

const SCENE_STOPS = (() => {
  const stops: number[] = [];
  let acc = INTRO;
  for (const s of SCENES) {
    stops.push(acc);
    acc += s.dur;
  }
  return stops;
})();
const OUTRO_START = SCENE_STOPS[SCENE_STOPS.length - 1] + SCENES[SCENES.length - 1].dur; // 564

const OVERLAY_START = 87; // 2.9s
const OVERLAY_DURATION = 255; // 8.5s -> ends at 11.4s

const SLICE = 15; // hrslice transition, 0.5s
const BANDS = 6;
const BAND_H = 1080 / BANDS;
const PAN_ZOOM = 1.15;
const PAN_MOVE = 40;

type Pan = 'left' | 'top' | 'top-left' | 'top-right' | 'bottom-right';

// Cover-fit slice geometry: each band shows a different 180px window of the
// image so the 6 bands reassemble a single continuous, centered crop.
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
  realtor: SlideshowProps['realtor'];
}> = ({ src, property, realtor }) => {
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
          top: 300,
          left: '50%',
          width: 250,
          height: 250,
          transform: 'translateX(-50%)',
          opacity,
        }}
      >
        <Img
          src={realtor.logoUrl}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 594,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: inter.fontFamily,
          fontWeight: 700,
          fontSize: 115,
          color: '#ffffff',
          textShadow: '5px 5px rgba(33,33,33,0.8)',
          lineHeight: 1.1,
          opacity,
          transform: `translateY(${rise}px)`,
        }}
      >
        Home For Sale
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 60,
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
            fontSize: 57,
            color: '#ffffff',
            lineHeight: 1.15,
          }}
        >
          {property.street?.trim() || property.address.split(',')[0]?.trim() || property.address}
        </div>
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 300,
            fontSize: 38,
            color: '#cccccc',
            marginTop: 2,
          }}
        >
          {property.city}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const InfoPanel: React.FC<{
  property: SlideshowProps['property'];
  realtor: SlideshowProps['realtor'];
}> = ({ property, realtor }) => {
  const frame = useCurrentFrame();
  const grow = Easing.out(Easing.exp)(Math.min(frame / 30, 1));
  const panelW = Math.round(678 * grow);
  const contentOpacity = Math.min(frame / 25, 1);
  const contentX = interpolate(frame, [0, 30], [-40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const stats: { value: string | number; label: string }[] = [
    { value: property.bedrooms, label: 'Bed' },
    { value: property.bathrooms, label: 'Bath' },
  ];
  if (property.sqft) stats.push({ value: property.sqft, label: 'SQFT' });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: panelW,
        backgroundColor: 'rgba(0,0,0,0.42)',
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 239,
          width: 200,
          height: 200,
          opacity: contentOpacity,
          transform: `translateX(${contentX}px)`,
        }}
      >
        <Img
          src={realtor.logoUrl}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      {stats.map((s, i) => (
        <div
          key={s.label}
          style={{
            position: 'absolute',
            top: 292 + i * 77,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: inter.fontFamily,
            fontWeight: 400,
            fontSize: 38,
            color: '#ffffff',
            opacity: contentOpacity,
            transform: `translateX(${contentX}px)`,
          }}
        >
          {formatStat(s.value)} {s.label}
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 680,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: contentOpacity,
          transform: `translateX(${contentX}px)`,
        }}
      >
        <div
          style={{
            width: 148,
            height: 148,
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
            fontFamily: inter.fontFamily,
            fontWeight: 700,
            fontSize: 36,
            color: '#ffffff',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          {realtor.name}
        </div>
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 400,
            fontSize: 32,
            color: 'rgba(255,255,255,0.9)',
            marginTop: 4,
            textAlign: 'center',
          }}
        >
          {realtor.phone}
        </div>
      </div>
    </div>
  );
};

const OutroScene: React.FC<{
  prevSrc: string;
  realtor: SlideshowProps['realtor'];
}> = ({ prevSrc, realtor }) => {
  const frame = useCurrentFrame();
  const slideT = Easing.inOut(Easing.cubic)(Math.min(frame / SLICE, 1));
  const headT = Easing.inOut(Easing.cubic)(
    Math.min(Math.max(frame - 8, 0) / 60, 1)
  );
  const headLeft = 1344 * headT; // 0 -> 70% of 1920
  const headWidth = 1920 - 1344 * headT; // 100% -> 30% of 1920
  const contactOpacity = interpolate(frame, [35, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const logoOpacity = interpolate(frame, [12, 42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{ background: 'linear-gradient(135deg, #0b1220 0%, #111827 100%)' }}
    >
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
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: headLeft,
              width: headWidth,
              overflow: 'hidden',
            }}
          >
            <Img
              src={realtor.headshotUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </AbsoluteFill>
      </CameraMotionBlur>
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 100,
          width: 180,
          height: 180,
          opacity: logoOpacity,
        }}
      >
        <Img
          src={realtor.logoUrl}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 320,
          left: 100,
          width: 20,
          height: 80,
          backgroundColor: '#e63946',
          opacity: contactOpacity,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 150,
          top: 300,
          opacity: contactOpacity,
        }}
      >
        <div
          style={{
            fontFamily: inter.fontFamily,
            fontWeight: 700,
            fontSize: 80,
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

export const SlideshowH3: React.FC<SlideshowProps> = ({
  images,
  property,
  realtor,
  musicTrackUrl,
}) => {
  const sceneSrc = (i: number) => images[Math.min(i, images.length - 1)] ?? '';

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      <Sequence from={0} durationInFrames={INTRO} layout="none">
        <IntroScene
          src={images[0] ?? ''}
          property={property}
          realtor={realtor}
        />
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

      <Sequence from={OVERLAY_START} durationInFrames={OVERLAY_DURATION} layout="none">
        <InfoPanel property={property} realtor={realtor} />
      </Sequence>

      <Sequence from={OUTRO_START} durationInFrames={OUTRO} layout="none">
        <OutroScene prevSrc={sceneSrc(SCENES.length)} realtor={realtor} />
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
