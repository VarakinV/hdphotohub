import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db/prisma';
import { posterSeekSecondsForDuration } from '@/lib/video/poster-timing';

/**
 * Pick a representative poster frame time for a Remotion reel.
 * - `REMOTION_POSTER_SEEK_SECONDS` env var wins (explicit override).
 * - Otherwise 35% into the reel using the template's registered duration
 *   (durationInFrames / fps), so the thumbnail lands mid-scene instead of in
 *   the opening animation (which is what a fixed 1s grab produced).
 * - Falls back to 3s when the template row is missing.
 */
export async function remotionPosterSeekSeconds(variantKey: string): Promise<number> {
  const override = Number(process.env.REMOTION_POSTER_SEEK_SECONDS);
  if (Number.isFinite(override) && override >= 0) return override;
  try {
    const t = await prisma.videoTemplate.findUnique({
      where: { variantKey },
      select: { durationInFrames: true, fps: true },
    });
    if (t?.durationInFrames && t?.fps) {
      return posterSeekSecondsForDuration(t.durationInFrames, t.fps);
    }
  } catch {
    // Template lookup failure — fall through to the default.
  }
  return 3;
}

/**
 * Check if we're running on Vercel (serverless environment where ffmpeg won't work)
 */
function isVercelEnvironment(): boolean {
  return !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL);
}

/**
 * Try to find ffmpeg binary path
 */
function findFfmpegPath(): string | null {
  try {
    const candidates: string[] = [];
    if (process.env.FFMPEG_PATH) candidates.push(process.env.FFMPEG_PATH);
    if (ffmpegPath) candidates.push(ffmpegPath as string);

    const cwd = process.cwd();
    const nm = path.join(cwd, 'node_modules');
    if (process.platform === 'win32') {
      candidates.push(path.join(nm, 'ffmpeg-static', 'ffmpeg.exe'));
      candidates.push(path.join(nm, '.bin', 'ffmpeg.exe'));
    } else {
      candidates.push(path.join(nm, 'ffmpeg-static', 'ffmpeg'));
      candidates.push(path.join(nm, '.bin', 'ffmpeg'));
    }

    // Fix for paths like "\\ROOT\\node_modules\\ffmpeg-static\\ffmpeg.exe" produced by bundlers on Windows
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (!c) continue;
      if (c.includes(`${path.sep}ROOT${path.sep}node_modules${path.sep}`)) {
        const rel = c.split(`${path.sep}ROOT${path.sep}`)[1];
        candidates[i] = path.join(cwd, rel);
      }
    }

    const found = candidates.find(p => {
      try { return !!p && fs.existsSync(p); } catch { return false; }
    });

    return found || null;
  } catch {
    return null;
  }
}

/**
 * Extract a single video frame as a JPEG buffer from a remote video URL.
 * - Uses ffmpeg-static binary path if available.
 * - Streams the frame via image2pipe to avoid filesystem writes.
 * - Resolves to a JPEG Buffer or throws on failure.
 * - Returns empty buffer on Vercel (ffmpeg not available in serverless)
 * @param seekSeconds Time offset (seconds) of the frame to grab; default 1.
 */
export async function extractPosterFromVideoUrl(videoUrl: string, seekSeconds = 1): Promise<Buffer> {
  if (!videoUrl || !/^https?:\/\//i.test(videoUrl)) {
    throw new Error('Invalid video URL for poster extraction');
  }

  // Skip on Vercel - ffmpeg binaries don't work in serverless environment
  if (isVercelEnvironment()) {
    console.log('[Poster] Skipping thumbnail generation on Vercel (ffmpeg not available in serverless)');
    return Buffer.alloc(0);
  }

  // Find and configure ffmpeg binary
  const ffmpegBinaryPath = findFfmpegPath();
  if (!ffmpegBinaryPath) {
    console.warn('[Poster] ffmpeg binary not found, thumbnail generation will likely fail');
  } else {
    ffmpeg.setFfmpegPath(ffmpegBinaryPath);
  }

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      const cmd = ffmpeg(videoUrl)
        .seekInput(Math.max(0, seekSeconds))
        .outputOptions(['-frames:v', '1', '-vcodec', 'mjpeg'])
        .format('image2pipe')
        .on('error', (err: Error) => {
          console.error('[Poster] ffmpeg error:', err.message);
          reject(err);
        })
        .on('end', () => {
          if (chunks.length === 0) {
            reject(new Error('No data produced by ffmpeg'));
          } else {
            resolve(Buffer.concat(chunks));
          }
        });

      const stream = cmd.pipe();
      stream.on('data', (d: Buffer) => {
        chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d));
      });
    } catch (e) {
      reject(e);
    }
  });
}

