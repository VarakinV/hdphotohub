'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { Player } from '@remotion/player';
import type { ReelProps, SlideshowProps } from '@/remotion/lib/types';
import { posterSeekSecondsForDuration } from '@/lib/video/poster-timing';
import { REEL_V1_DURATION } from '@/remotion/compositions/reels/ReelV1';
import { REEL_V2_DURATION } from '@/remotion/compositions/reels/ReelV2';
import { REEL_V3_DURATION } from '@/remotion/compositions/reels/ReelV3';
import { REEL_V4_DURATION } from '@/remotion/compositions/reels/ReelV4';
import { REEL_V5_DURATION } from '@/remotion/compositions/reels/ReelV5';
import { REEL_V6_DURATION } from '@/remotion/compositions/reels/ReelV6';
import { REEL_V7_DURATION } from '@/remotion/compositions/reels/ReelV7';
import { REEL_V8_DURATION } from '@/remotion/compositions/reels/ReelV8';
import { REEL_V9_DURATION } from '@/remotion/compositions/reels/ReelV9';
import { REEL_V10_DURATION } from '@/remotion/compositions/reels/ReelV10';
import { REEL_V11_DURATION } from '@/remotion/compositions/reels/ReelV11';
import { REEL_V12_DURATION } from '@/remotion/compositions/reels/ReelV12';
import { REEL_V13_DURATION } from '@/remotion/compositions/reels/ReelV13';
import { REEL_V14_DURATION } from '@/remotion/compositions/reels/ReelV14';
import { REEL_V15_DURATION } from '@/remotion/compositions/reels/ReelV15';
import { REEL_V16_DURATION } from '@/remotion/compositions/reels/ReelV16';
import { REEL_V17_DURATION } from '@/remotion/compositions/reels/ReelV17';
import { SLIDESHOW_H1_DURATION } from '@/remotion/compositions/slideshows/SlideshowH1';
import { SLIDESHOW_H2_DURATION } from '@/remotion/compositions/slideshows/SlideshowH2';
import { SLIDESHOW_H3_DURATION } from '@/remotion/compositions/slideshows/SlideshowH3';
import { SLIDESHOW_H4_DURATION } from '@/remotion/compositions/slideshows/SlideshowH4';

const ReelV1 = dynamic(() => import('@/remotion/compositions/reels/ReelV1').then((m) => m.ReelV1), { ssr: false });
const ReelV2 = dynamic(() => import('@/remotion/compositions/reels/ReelV2').then((m) => m.ReelV2), { ssr: false });
const ReelV3 = dynamic(() => import('@/remotion/compositions/reels/ReelV3').then((m) => m.ReelV3), { ssr: false });
const ReelV4 = dynamic(() => import('@/remotion/compositions/reels/ReelV4').then((m) => m.ReelV4), { ssr: false });
const ReelV5 = dynamic(() => import('@/remotion/compositions/reels/ReelV5').then((m) => m.ReelV5), { ssr: false });
const ReelV6 = dynamic(() => import('@/remotion/compositions/reels/ReelV6').then((m) => m.ReelV6), { ssr: false });
const ReelV7 = dynamic(() => import('@/remotion/compositions/reels/ReelV7').then((m) => m.ReelV7), { ssr: false });
const ReelV8 = dynamic(() => import('@/remotion/compositions/reels/ReelV8').then((m) => m.ReelV8), { ssr: false });
const ReelV9 = dynamic(() => import('@/remotion/compositions/reels/ReelV9').then((m) => m.ReelV9), { ssr: false });
const ReelV10 = dynamic(() => import('@/remotion/compositions/reels/ReelV10').then((m) => m.ReelV10), { ssr: false });
const ReelV11 = dynamic(() => import('@/remotion/compositions/reels/ReelV11').then((m) => m.ReelV11), { ssr: false });
const ReelV12 = dynamic(() => import('@/remotion/compositions/reels/ReelV12').then((m) => m.ReelV12), { ssr: false });
const ReelV13 = dynamic(() => import('@/remotion/compositions/reels/ReelV13').then((m) => m.ReelV13), { ssr: false });
const ReelV14 = dynamic(() => import('@/remotion/compositions/reels/ReelV14').then((m) => m.ReelV14), { ssr: false });
const ReelV15 = dynamic(() => import('@/remotion/compositions/reels/ReelV15').then((m) => m.ReelV15), { ssr: false });
const ReelV16 = dynamic(() => import('@/remotion/compositions/reels/ReelV16').then((m) => m.ReelV16), { ssr: false });
const ReelV17 = dynamic(() => import('@/remotion/compositions/reels/ReelV17').then((m) => m.ReelV17), { ssr: false });
const SlideshowH1 = dynamic(() => import('@/remotion/compositions/slideshows/SlideshowH1').then((m) => m.SlideshowH1), { ssr: false });
const SlideshowH2 = dynamic(() => import('@/remotion/compositions/slideshows/SlideshowH2').then((m) => m.SlideshowH2), { ssr: false });
const SlideshowH3 = dynamic(() => import('@/remotion/compositions/slideshows/SlideshowH3').then((m) => m.SlideshowH3), { ssr: false });
const SlideshowH4 = dynamic(() => import('@/remotion/compositions/slideshows/SlideshowH4').then((m) => m.SlideshowH4), { ssr: false });

const SAMPLE: ReelProps = {
  images: [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1080&h=1920&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1080&h=1920&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080&h=1920&fit=crop',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1080&h=1920&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1080&h=1920&fit=crop',
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
  variantKey: 'preview',
};

const COMPOSITION_REGISTRY: Record<
  string,
  { component: ComponentType<ReelProps | SlideshowProps>; width: number; height: number; fps: number; durationInFrames: number }
> = {
  ReelV1: { component: ReelV1 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V1_DURATION },
  ReelV2: { component: ReelV2 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V2_DURATION },
  ReelV3: { component: ReelV3 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V3_DURATION },
  ReelV4: { component: ReelV4 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V4_DURATION },
  ReelV5: { component: ReelV5 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V5_DURATION },
  ReelV6: { component: ReelV6 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V6_DURATION },
  ReelV7: { component: ReelV7 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V7_DURATION },
  ReelV8: { component: ReelV8 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V8_DURATION },
  ReelV9: { component: ReelV9 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V9_DURATION },
  ReelV10: { component: ReelV10 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V10_DURATION },
  ReelV11: { component: ReelV11 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V11_DURATION },
  ReelV12: { component: ReelV12 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V12_DURATION },
  ReelV13: { component: ReelV13 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V13_DURATION },
  ReelV14: { component: ReelV14 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V14_DURATION },
  ReelV15: { component: ReelV15 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V15_DURATION },
  ReelV16: { component: ReelV16 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V16_DURATION },
  ReelV17: { component: ReelV17 as ComponentType<ReelProps>, width: 1080, height: 1920, fps: 30, durationInFrames: REEL_V17_DURATION },
  SlideshowH1: { component: SlideshowH1 as ComponentType<SlideshowProps>, width: 1920, height: 1080, fps: 30, durationInFrames: SLIDESHOW_H1_DURATION },
  SlideshowH2: { component: SlideshowH2 as ComponentType<SlideshowProps>, width: 1920, height: 1080, fps: 30, durationInFrames: SLIDESHOW_H2_DURATION },
  SlideshowH3: { component: SlideshowH3 as ComponentType<SlideshowProps>, width: 1920, height: 1080, fps: 30, durationInFrames: SLIDESHOW_H3_DURATION },
  SlideshowH4: { component: SlideshowH4 as ComponentType<SlideshowProps>, width: 1920, height: 1080, fps: 30, durationInFrames: SLIDESHOW_H4_DURATION },
};

export function TemplatePreview({
  compositionId,
}: {
  compositionId: string;
}) {
  const entry = COMPOSITION_REGISTRY[compositionId];
  if (!entry) {
    return (
      <div className="aspect-[9/16] w-full bg-gray-100 rounded-md flex items-center justify-center text-sm text-gray-500 p-4 text-center">
        Composition {compositionId} not built yet — draft preview unavailable.
      </div>
    );
  }

  const { component, width, height, fps, durationInFrames } = entry;

  // Start the preview at the same representative mid-scene frame used for
  // delivery thumbnails, instead of the opening animation.
  const initialFrame = Math.round(posterSeekSecondsForDuration(durationInFrames, fps) * fps);

  return (
    <div className="w-full bg-gray-950 rounded-md overflow-hidden">
      <Player
        component={component}
        inputProps={SAMPLE}
        durationInFrames={durationInFrames}
        compositionWidth={width}
        compositionHeight={height}
        fps={fps}
        initialFrame={initialFrame}
        controls
        loop
        style={{ width: '100%' }}
      />
    </div>
  );
}
