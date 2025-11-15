import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';

/**
 * Extract the first video frame as a JPEG buffer from a remote video URL.
 * - Uses ffmpeg-static binary path if available.
 * - Streams the frame via image2pipe to avoid filesystem writes.
 * - Resolves to a JPEG Buffer or throws on failure.
 */
export async function extractPosterFromVideoUrl(videoUrl: string): Promise<Buffer> {
  if (!videoUrl || !/^https?:\/\//i.test(videoUrl)) {
    throw new Error('Invalid video URL for poster extraction');
  }

  // Configure ffmpeg binary if available and path is valid; otherwise let ffmpeg fall back to system PATH.
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
    if (found) {
      // @ts-ignore string path accepted
      ffmpeg.setFfmpegPath(found as string);
    }
  } catch {}

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      const cmd = ffmpeg(videoUrl)
        .seekInput(1)
        .outputOptions(['-frames:v', '1', '-vcodec', 'mjpeg'])
        .format('image2pipe')
        .on('error', (err: Error) => reject(err))
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

