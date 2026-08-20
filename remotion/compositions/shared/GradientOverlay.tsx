import React from 'react';
import { AbsoluteFill } from 'remotion';

export const GradientOverlay: React.FC<{
  from?: 'top' | 'bottom';
  opacity?: number;
  color?: string;
}> = ({ from = 'bottom', opacity = 0.7, color = '#000000' }) => {
  const gradient =
    from === 'bottom'
      ? `linear-gradient(to top, ${color} 0%, ${color}00 60%)`
      : `linear-gradient(to bottom, ${color} 0%, ${color}00 60%)`;

  return (
    <AbsoluteFill
      style={{
        background: gradient,
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};
