import React from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig, Easing, Img } from 'remotion';
import type { ReelProps } from '../lib/types';
import { ImageSlide, GradientOverlay, StatCounter, PropertyCard, RealtorCard, BrandBar, MusicOverlay } from './shared';
import { playfairDisplay, inter, lato } from '../lib/fonts';

const SAMPLE: ReelProps = {
  images: [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1080&h=1920&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1080&h=1920&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080&h=1920&fit=crop',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1080&h=1920&fit=crop',
  ],
  property: {
    address: '1247 Sunset Ridge Drive',
    street: '1247 Sunset Ridge Drive',
    city: 'West Vancouver',
    postalCode: 'V7V 1A1',
    province: 'BC',
    bedrooms: '2+1',
    bathrooms: '2.5',
    sqft: '1,530',
  },
  realtor: {
    name: 'Sarah Mitchell',
    phone: '(604) 555-0123',
    headshotUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
    logoUrl: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=120&fit=crop',
  },
  variantKey: 'preview',
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const titleScale = interpolate(frame, [0, 30], [0.85, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: 'perceptual-scale',
  });
  const subOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          opacity: titleOpacity,
          scale: titleScale,
          fontFamily: playfairDisplay.fontFamily,
          fontWeight: 900,
          fontSize: 120,
          color: '#ffffff',
          letterSpacing: '-0.03em',
          textShadow: '0 4px 32px rgba(0,0,0,0.5)',
        }}
      >
        JUST LISTED
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '40%',
          opacity: subOpacity,
          fontFamily: inter.fontFamily,
          fontWeight: 500,
          fontSize: 32,
          color: 'rgba(255,255,255,0.85)',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
        }}
      >
        A new opportunity awaits
      </div>
    </AbsoluteFill>
  );
};

const StatScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 80 }}>
        <StatCounter value={SAMPLE.property.bedrooms} label="Beds" delayInFrames={0} />
        <StatCounter value={SAMPLE.property.bathrooms} label="Baths" delayInFrames={8} />
        <StatCounter value={SAMPLE.property.sqft ?? 0} label="Sq Ft" delayInFrames={16} format={(n) => n.toLocaleString()} />
      </div>
    </AbsoluteFill>
  );
};

const PropertyScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 80 }}>
      <PropertyCard property={SAMPLE.property} delayInFrames={0} />
    </AbsoluteFill>
  );
};

const RealtorScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <RealtorCard realtor={SAMPLE.realtor} delayInFrames={0} variant="vertical" />
    </AbsoluteFill>
  );
};

export const SharedPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      <Sequence name="Scene 1: Hero image" from={0} durationInFrames={120}>
        <ImageSlide src={SAMPLE.images[0]} mode="zoom-in" />
        <GradientOverlay from="bottom" opacity={0.75} />
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Intro />
        </AbsoluteFill>
        <BrandBar realtor={SAMPLE.realtor} delayInFrames={20} position="bottom" />
      </Sequence>

      <Sequence name="Scene 2: Property card" from={135} durationInFrames={120}>
        <ImageSlide src={SAMPLE.images[1]} mode="pan-right" />
        <GradientOverlay from="bottom" opacity={0.7} />
        <PropertyScene />
      </Sequence>

      <Sequence name="Scene 3: Stat counter" from={270} durationInFrames={120}>
        <ImageSlide src={SAMPLE.images[2]} mode="zoom-out" />
        <GradientOverlay opacity={0.85} />
        <StatScene />
      </Sequence>

      <Sequence name="Scene 4: Address hero" from={405} durationInFrames={120}>
        <ImageSlide src={SAMPLE.images[3]} mode="pan-up" />
        <GradientOverlay from="bottom" opacity={0.7} />
        <PropertyScene />
      </Sequence>

      <Sequence name="Scene 5: Realtor CTA" from={540} durationInFrames={120}>
        <ImageSlide src={SAMPLE.images[0]} mode="zoom-in" />
        <GradientOverlay opacity={0.8} />
        <RealtorScene />
      </Sequence>

      <BrandBar realtor={SAMPLE.realtor} delayInFrames={20} position="bottom" />
    </AbsoluteFill>
  );
};
