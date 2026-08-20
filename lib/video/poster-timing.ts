/**
 * Pick a representative preview/poster time for a video: 35% into the
 * duration, clamped to [2s, duration-1s] so it lands mid-scene instead of in
 * the opening animation. Shared by the delivery poster extraction
 * (remotionPosterSeekSeconds) and the admin template preview Player.
 */
export function posterSeekSecondsForDuration(durationInFrames: number, fps: number): number {
  if (!durationInFrames || !fps) return 3;
  const duration = durationInFrames / fps;
  return Math.min(Math.max(duration * 0.35, 2), Math.max(duration - 1, 2));
}
