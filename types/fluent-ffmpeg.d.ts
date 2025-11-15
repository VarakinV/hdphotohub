declare module 'fluent-ffmpeg' {
  type FfmpegCommand = any;
  function ffmpeg(input?: any): FfmpegCommand;
  namespace ffmpeg {
    function setFfmpegPath(path: string): void;
  }
  export default ffmpeg;
}

