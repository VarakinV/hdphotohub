import React from 'react';
import { Composition, Folder } from 'remotion';
import { HelloWorld } from './compositions/HelloWorld';
import { SharedPreview } from './compositions/SharedPreview';
import { ReelV1, REEL_V1_DURATION } from './compositions/reels/ReelV1';
import { ReelV2, REEL_V2_DURATION } from './compositions/reels/ReelV2';
import { ReelV3, REEL_V3_DURATION } from './compositions/reels/ReelV3';
import { ReelV4, REEL_V4_DURATION } from './compositions/reels/ReelV4';
import { ReelV5, REEL_V5_DURATION } from './compositions/reels/ReelV5';
import { ReelV6, REEL_V6_DURATION } from './compositions/reels/ReelV6';
import { ReelV7, REEL_V7_DURATION } from './compositions/reels/ReelV7';
import { ReelV8, REEL_V8_DURATION } from './compositions/reels/ReelV8';
import { ReelV9, REEL_V9_DURATION } from './compositions/reels/ReelV9';
import { ReelV10, REEL_V10_DURATION } from './compositions/reels/ReelV10';
import { ReelV11, REEL_V11_DURATION } from './compositions/reels/ReelV11';
import { ReelV12, REEL_V12_DURATION } from './compositions/reels/ReelV12';
import { ReelV13, REEL_V13_DURATION } from './compositions/reels/ReelV13';
import { ReelV14, REEL_V14_DURATION } from './compositions/reels/ReelV14';
import { ReelV15, REEL_V15_DURATION } from './compositions/reels/ReelV15';
import { ReelV16, REEL_V16_DURATION } from './compositions/reels/ReelV16';
import { ReelV17, REEL_V17_DURATION } from './compositions/reels/ReelV17';
import { SlideshowH1, SLIDESHOW_H1_DURATION } from './compositions/slideshows/SlideshowH1';
import { SlideshowH2, SLIDESHOW_H2_DURATION } from './compositions/slideshows/SlideshowH2';
import { SlideshowH3, SLIDESHOW_H3_DURATION } from './compositions/slideshows/SlideshowH3';
import { SlideshowH4, SLIDESHOW_H4_DURATION } from './compositions/slideshows/SlideshowH4';
import { reelPropsSchema, slideshowPropsSchema } from './lib/types';

const defaultReelProps = {
  images: [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1800&h=1200&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1800&h=1200&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1800&h=1200&fit=crop',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1800&h=1200&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1800&h=1200&fit=crop',
  ],
  property: {
    address: '1247 Sunset Ridge Drive',
    street: '1247 Sunset Ridge Drive',
    city: 'West Vancouver',
    postalCode: 'V7V 1A1',
    province: 'BC',
    bedrooms: '3+1',
    bathrooms: '2.5',
    sqft: '1,530',
  },
  realtor: {
    name: 'Sarah Mitchell',
    phone: '(604) 555-0123',
    headshotUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
    logoUrl: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=120&fit=crop',
  },
  variantKey: 'v1-9x16',
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Hello">
        <Composition
          id="HelloWorld"
          component={HelloWorld}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1920}
        />
      </Folder>

      <Folder name="Shared-Components-Preview">
        <Composition
          id="SharedPreview"
          component={SharedPreview}
          durationInFrames={660}
          fps={30}
          width={1080}
          height={1920}
          schema={reelPropsSchema}
          defaultProps={defaultReelProps}
        />
      </Folder>

      <Folder name="Reels">
        <Composition
          id="ReelV1"
          component={ReelV1}
          durationInFrames={REEL_V1_DURATION}
          fps={30}
          width={1080}
          height={1920}
          schema={reelPropsSchema}
          defaultProps={defaultReelProps}
        />
        {([
          [ReelV2, 'ReelV2', REEL_V2_DURATION],
          [ReelV3, 'ReelV3', REEL_V3_DURATION],
          [ReelV4, 'ReelV4', REEL_V4_DURATION],
          [ReelV5, 'ReelV5', REEL_V5_DURATION],
          [ReelV6, 'ReelV6', REEL_V6_DURATION],
          [ReelV7, 'ReelV7', REEL_V7_DURATION],
          [ReelV8, 'ReelV8', REEL_V8_DURATION],
          [ReelV9, 'ReelV9', REEL_V9_DURATION],
          [ReelV10, 'ReelV10', REEL_V10_DURATION],
          [ReelV11, 'ReelV11', REEL_V11_DURATION],
          [ReelV12, 'ReelV12', REEL_V12_DURATION],
          [ReelV13, 'ReelV13', REEL_V13_DURATION],
          [ReelV14, 'ReelV14', REEL_V14_DURATION],
          [ReelV15, 'ReelV15', REEL_V15_DURATION],
          [ReelV16, 'ReelV16', REEL_V16_DURATION],
          [ReelV17, 'ReelV17', REEL_V17_DURATION],
        ] as const).map(([Component, id, duration]) => (
          <Composition
            key={id}
            id={id}
            component={Component}
            durationInFrames={duration}
            fps={30}
            width={1080}
            height={1920}
            schema={reelPropsSchema}
            defaultProps={defaultReelProps}
          />
        ))}
      </Folder>

      <Folder name="Slideshows">
        <Composition
          id="SlideshowH1"
          component={SlideshowH1}
          durationInFrames={SLIDESHOW_H1_DURATION}
          fps={30}
          width={1920}
          height={1080}
          schema={slideshowPropsSchema}
          defaultProps={defaultReelProps}
        />
        <Composition
          id="SlideshowH2"
          component={SlideshowH2}
          durationInFrames={SLIDESHOW_H2_DURATION}
          fps={30}
          width={1920}
          height={1080}
          schema={slideshowPropsSchema}
          defaultProps={defaultReelProps}
        />
        <Composition
          id="SlideshowH3"
          component={SlideshowH3}
          durationInFrames={SLIDESHOW_H3_DURATION}
          fps={30}
          width={1920}
          height={1080}
          schema={slideshowPropsSchema}
          defaultProps={defaultReelProps}
        />
        <Composition
          id="SlideshowH4"
          component={SlideshowH4}
          durationInFrames={SLIDESHOW_H4_DURATION}
          fps={30}
          width={1920}
          height={1080}
          schema={slideshowPropsSchema}
          defaultProps={defaultReelProps}
        />
      </Folder>
    </>
  );
};
