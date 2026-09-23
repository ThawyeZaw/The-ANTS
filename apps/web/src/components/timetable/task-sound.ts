let audioContext: AudioContext | null = null;

/** Short two-note chime when a task is checked off. */
export function playTaskCompleteSound(): void {
  try {
    const Context = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    audioContext = audioContext ?? new Context();
    if (audioContext.state === 'suspended') void audioContext.resume();

    const now = audioContext.currentTime;
    const master = audioContext.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.07, now + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    master.connect(audioContext.destination);

    const tone = (frequency: number, start: number, duration: number) => {
      const osc = audioContext!.createOscillator();
      const gain = audioContext!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.9, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    };

    tone(523.25, now, 0.14);
    tone(783.99, now + 0.08, 0.18);
  } catch {
    /* autoplay or missing audio should never block checking a task */
  }
}
