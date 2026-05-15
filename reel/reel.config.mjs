export default {
  name: 'makeqr-reel',
  entry: './reel.html',
  output: './output/makeqr-reel.mp4',
  tmpDir: '_tmp',
  width: 1080,
  height: 1920,
  durationMs: 19000,
  fps: 30,
  waitUntil: 'domcontentloaded',
  waitAfterLoadMs: 200,
};
