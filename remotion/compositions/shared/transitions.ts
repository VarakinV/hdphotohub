import { linearTiming, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import type { TransitionPresentation, TransitionTiming } from '@remotion/transitions';

export type TransitionSpec = {
  presentation: TransitionPresentation<any>;
  timing: TransitionTiming;
};

export const transitions = {
  smoothFade: {
    presentation: fade(),
    timing: linearTiming({ durationInFrames: 25 }),
  },
  slideUp: {
    presentation: slide({ direction: 'from-bottom' }),
    timing: springTiming({ config: { damping: 200 }, durationInFrames: 30 }),
  },
  slideRight: {
    presentation: slide({ direction: 'from-left' }),
    timing: springTiming({ config: { damping: 200 }, durationInFrames: 30 }),
  },
  slideLeft: {
    presentation: slide({ direction: 'from-right' }),
    timing: springTiming({ config: { damping: 200 }, durationInFrames: 30 }),
  },
  wipeReveal: {
    presentation: wipe({ direction: 'from-right' }),
    timing: linearTiming({ durationInFrames: 25 }),
  },
} as const;

export type TransitionPreset = keyof typeof transitions;

export const getTransition = (preset: TransitionPreset): TransitionSpec =>
  transitions[preset] as unknown as TransitionSpec;
