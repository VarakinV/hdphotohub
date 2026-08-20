import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import type { Realtor } from '../../lib/types';
import { lato } from '../../lib/fonts';

export const RealtorCard: React.FC<{
  realtor: Realtor;
  delayInFrames?: number;
  variant?: 'horizontal' | 'vertical';
}> = ({ realtor, delayInFrames = 0, variant = 'horizontal' }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const localFrame = Math.max(0, frame - delayInFrames);
  const opacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const translateX = interpolate(localFrame, [0, 25], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const isVertical = width === 1080;
  const isHorizontalCard = variant === 'horizontal' || !isVertical;

  return (
    <div
      style={{
        opacity,
        translate: `${translateX}px 0px`,
        display: 'flex',
        flexDirection: isHorizontalCard ? 'row' : 'column',
        alignItems: 'center',
        gap: isHorizontalCard ? 24 : 16,
        padding: isHorizontalCard ? '20px 32px' : '24px 32px',
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24,
        boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
      }}
    >
      <div
        style={{
          width: isHorizontalCard ? 96 : 120,
          height: isHorizontalCard ? 96 : 120,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          border: '3px solid rgba(255,255,255,0.85)',
          backgroundColor: '#222',
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            fontFamily: lato.fontFamily,
            fontWeight: 700,
            fontSize: isHorizontalCard ? 28 : 32,
            color: '#ffffff',
            letterSpacing: '-0.01em',
          }}
        >
          {realtor.name}
        </div>
        <div
          style={{
            fontFamily: lato.fontFamily,
            fontWeight: 900,
            fontSize: isHorizontalCard ? 32 : 36,
            color: '#fbbf24',
            letterSpacing: '0.02em',
          }}
        >
          {realtor.phone}
        </div>
      </div>
    </div>
  );
};
