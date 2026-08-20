import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const HelloWorld: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <h1
        style={{
          color: '#ffffff',
          fontSize: 80,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          opacity,
        }}
      >
        Remotion is set up
      </h1>
    </AbsoluteFill>
  );
};
