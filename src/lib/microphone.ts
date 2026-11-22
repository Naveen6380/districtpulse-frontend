/** Live local signal monitoring. Samples are neither persisted nor uploaded. */
export function monitorMicrophone(
  stream: MediaStream,
  level: (value: number) => void,
  finish: () => void,
) {
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream),
    analyser = context.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);
  const samples = new Float32Array(analyser.fftSize);
  let lastSpeech = 0,
    voicedFrames = 0,
    finished = false;
  void context.resume().catch(() => {});
  const timer = setInterval(() => {
    analyser.getFloatTimeDomainData(samples);
    const rms = Math.sqrt(samples.reduce((sum, v) => sum + v * v, 0) / samples.length);
    level(Math.min(1, rms * 8));
    const now = performance.now();
    if (rms > 0.006) {
      lastSpeech = now;
      voicedFrames++;
    }
    if (!finished && voicedFrames >= 3 && lastSpeech && now - lastSpeech > 1400) {
      finished = true;
      finish();
    }
  }, 100);
  return () => {
    clearInterval(timer);
    source.disconnect();
    void context.close().catch(() => {});
  };
}
