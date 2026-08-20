import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';

const isNumericStat = (value: string | number): boolean => {
  if (typeof value === 'number') return Number.isFinite(value);
  return /^\d+(\.\d+)?$/.test(String(value).trim());
};

export const StatCounter: React.FC<{
  value: string | number;
  label: string;
  delayInFrames?: number;
  durationInFrames?: number;
  format?: (n: number) => string;
}> = ({ value, label, delayInFrames = 0, durationInFrames = 30, format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = Math.max(0, frame - delayInFrames);

  // Non-numeric stats ("2+1", "2.5 baths") render as-is; numeric ones count up.
  const numeric = isNumericStat(value);
  const numericValue = typeof value === 'number'
    ? value
    : parseFloat(String(value).replace(/,/g, '').trim());

  const progress = interpolate(localFrame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const current = numeric ? Math.round(numericValue * progress) : NaN;
  const display = numeric
    ? format
      ? format(current)
      : String(current)
    : String(value);

  const opacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(localFrame, [0, 20], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        opacity,
        translate: `0px ${translateY}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 800,
          fontSize: 96,
          color: '#ffffff',
          lineHeight: 1,
          letterSpacing: '-0.04em',
        }}
      >
        {display}
      </div>
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: 24,
          color: 'rgba(255,255,255,0.85)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
        }}
      >
        {label}
      </div>
    </div>
  );
};
