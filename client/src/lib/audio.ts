// Sensory Feedback Engine using Web Audio API (Zero external assets required)

class AudioEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private lastBrushTime = 0;

  private initContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Create or get cached 1-second white noise buffer for brush friction
  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleRate; i++) {
      // White noise with pinkish smoothing
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  /**
   * Procedural brush scratch sound played during stroke drawing.
   * Modulated by velocity/speed of drawing.
   */
  public playBrushScratch(speed: number = 1) {
    const now = performance.now();
    // Throttle slightly so we don't spawn thousands of nodes per second
    if (now - this.lastBrushTime < 35) return;
    this.lastBrushTime = now;

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const noise = this.getNoiseBuffer(ctx);
      const source = ctx.createBufferSource();
      source.buffer = noise;

      // Filter: bandpass to simulate dry paper texture
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(Math.min(3200, 900 + speed * 120), t);
      filter.Q.setValueAtTime(1.8, t);

      // Gain envelope
      const gain = ctx.createGain();
      const intensity = Math.min(0.08, 0.02 + speed * 0.005);
      gain.gain.setValueAtTime(intensity, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start(t);
      source.stop(t + 0.06);
    } catch {
      // AudioContext might be muted or blocked by browser policy until gesture
    }
  }

  /**
   * Ethnic Batak Gondang / Ogung resonant chime played on success (score >= 75%).
   * Synthesized using harmonic pentatonic bell tones with exponential decay.
   */
  public playEthnicSuccessChime() {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      // Traditional Batak Gondang harmonic resonant scale (Hz)
      const freqs = [440, 554.37, 659.25, 880, 1108.7];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.06);

        // Rich bell decay envelope
        const noteStart = t + idx * 0.06;
        const volume = 0.15 / (idx + 1);
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.linearRampToValueAtTime(volume, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 1.3);
      });
    } catch {
      // Audio safety
    }
  }

  /**
   * Subtle click / action sound for UI buttons.
   */
  public playClickSound() {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.04);

      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch {}
  }
}

export const sound = new AudioEngine();
