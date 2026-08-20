import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';

export type KenBurnsMode = 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'pan-up' | 'pan-down';

export const ImageSlide: React.FC<{
  src: string;
  mode?: KenBurnsMode;
  intensity?: number;
}> = ({ src, mode = 'zoom-in', intensity = 0.12 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  switch (mode) {
    case 'zoom-in':
      scale = 1 + intensity * progress;
      break;
    case 'zoom-out':
      scale = 1 + intensity * (1 - progress);
      break;
    case 'pan-left':
      translateX = -intensity * width * progress;
      scale = 1 + intensity * 0.5;
      break;
    case 'pan-right':
      translateX = intensity * width * progress;
      scale = 1 + intensity * 0.5;
      break;
    case 'pan-up':
      translateY = -intensity * height * progress;
      scale = 1 + intensity * 0.5;
      break;
    case 'pan-down':
      translateY = intensity * height * progress;
      scale = 1 + intensity * 0.5;
      break;
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        overflow: 'hidden',
      }}
    >
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale,
          translate: `${translateX}px ${translateY}px`,
        }}
      />
    </AbsoluteFill>
  );
};
