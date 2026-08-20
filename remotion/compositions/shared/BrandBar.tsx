import React from 'react';
import { Img, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import type { Realtor } from '../../lib/types';

export const BrandBar: React.FC<{
  realtor: Realtor;
  delayInFrames?: number;
  position?: 'top' | 'bottom';
}> = ({ realtor, delayInFrames = 0, position = 'bottom' }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const localFrame = Math.max(0, frame - delayInFrames);
  const opacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const translateY = interpolate(
    localFrame,
    [0, 25],
    [position === 'top' ? -30 : 30, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
  );

  const isVertical = width === 1080;
  const barHeight = isVertical ? 100 : 80;

  return (
    <div
      style={{
        position: 'absolute',
        top: position === 'top' ? 0 : height - barHeight,
        left: 0,
        right: 0,
        height: barHeight,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${isVertical ? 48 : 64}px`,
        opacity,
        translate: `0px ${translateY}px`,
      }}
    >
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 800,
          fontSize: isVertical ? 24 : 22,
          color: '#ffffff',
          letterSpacing: '0.02em',
        }}
      >
        {realtor.name.toUpperCase()}
      </div>
      <div
        style={{
          height: isVertical ? 64 : 52,
          maxWidth: isVertical ? 200 : 160,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Img
          src={realtor.logoUrl}
          style={{
            maxHeight: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
};
