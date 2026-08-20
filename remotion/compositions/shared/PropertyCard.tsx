import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import type { Property } from '../../lib/types';
import { playfairDisplay } from '../../lib/fonts';

export const PropertyCard: React.FC<{
  property: Property;
  delayInFrames?: number;
  layout?: 'stacked' | 'inline';
}> = ({ property, delayInFrames = 0, layout = 'stacked' }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const localFrame = Math.max(0, frame - delayInFrames);
  const opacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const translateY = interpolate(localFrame, [0, 25], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const isVertical = width === 1080;

  return (
    <div
      style={{
        opacity,
        translate: `0px ${translateY}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isVertical ? 'center' : 'flex-start',
        gap: isVertical ? 12 : 8,
        textAlign: isVertical ? 'center' : 'left',
      }}
    >
      <div
        style={{
          fontFamily: playfairDisplay.fontFamily,
          fontWeight: 700,
          fontSize: isVertical ? 72 : 64,
          color: '#ffffff',
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          textShadow: '0 2px 24px rgba(0,0,0,0.4)',
        }}
      >
        {property.address}
      </div>
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: isVertical ? 32 : 28,
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: '0.01em',
          textShadow: '0 1px 12px rgba(0,0,0,0.4)',
        }}
      >
        {[property.city, property.province, property.postalCode].filter(Boolean).join(', ')}
      </div>
    </div>
  );
};
