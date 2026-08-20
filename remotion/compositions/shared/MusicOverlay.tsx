import React from 'react';
import { Audio, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const MusicOverlay: React.FC<{
  src?: string;
  volume?: number;
  fadeInFrames?: number;
  fadeOutFrames?: number;
}> = ({ src, volume = 0.8, fadeInFrames = 15, fadeOutFrames = 30 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  if (!src) return null;

  const fadeInEnd = fadeInFrames;
  const fadeOutStart = durationInFrames - fadeOutFrames;

  return (
    <Audio
      src={src}
      volume={(f) => {
        if (f < fadeInEnd) {
          return interpolate(f, [0, fadeInEnd], [0, volume], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
        }
        if (f > fadeOutStart) {
          return interpolate(f, [fadeOutStart, durationInFrames], [volume, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
        }
        return volume;
      }}
    />
  );
};
