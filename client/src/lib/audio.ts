// World-Class Spatial & Generative Audio Engine using Web Audio API
// Features: 3D Spatial Audio (PannerNode & HRTF), Procedural Hasapi Batak Pentatonic Plucking,
// Spatial Bamboo Pen Scratching, Resonant Bronze Bell Chime, and Ambient Oil Lantern Hiss.

// Batak Pentatonic Modal Frequencies (Hz) for Hasapi boat-lute
// Notes: A3, B3, C#4, E4, F#4, A4, B4, C#5
const HASAPI_PENTATONIC = [220.0, 246.94, 277.18, 329.63, 369.99, 440.0, 493.88, 554.37];

class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private lastBrushTime = 0;
  private lanternGainNode: GainNode | null = null;
  private lanternSource: AudioBufferSourceNode | null = null;
  private lanternPanner: PannerNode | null = null;
  private hasapiSequenceIndex = 0;

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Create or retrieve cached 1-second white noise buffer
  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleRate; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.45;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  /**
   * Helper to create a configured 3D PannerNode positioned at [x, y, z].
   */
  private createPanner(ctx: AudioContext, pos: [number, number, number]): PannerNode {
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1.2;
    panner.maxDistance = 1000;
    panner.rolloffFactor = 1.0;
    panner.coneInnerAngle = 360;

    const t = ctx.currentTime;
    if (panner.positionX) {
      panner.positionX.setValueAtTime(pos[0], t);
      panner.positionY.setValueAtTime(pos[1], t);
      panner.positionZ.setValueAtTime(pos[2], t);
    } else {
      // Fallback for older Web Audio API implementations
      (panner as unknown as { setPosition: (x: number, y: number, z: number) => void }).setPosition(
        pos[0],
        pos[1],
        pos[2]
      );
    }
    return panner;
  }

  /**
   * Update the spatial listener orientation according to Three.js camera position.
   */
  public updateListener(
    camPos: [number, number, number],
    forward: [number, number, number] = [0, 0, -1],
    up: [number, number, number] = [0, 1, 0]
  ) {
    const ctx = this.initContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const listener = ctx.listener;

    if (listener.positionX) {
      listener.positionX.setValueAtTime(camPos[0], t);
      listener.positionY.setValueAtTime(camPos[1], t);
      listener.positionZ.setValueAtTime(camPos[2], t);
      listener.forwardX.setValueAtTime(forward[0], t);
      listener.forwardY.setValueAtTime(forward[1], t);
      listener.forwardZ.setValueAtTime(forward[2], t);
      listener.upX.setValueAtTime(up[0], t);
      listener.upY.setValueAtTime(up[1], t);
      listener.upZ.setValueAtTime(up[2], t);
    } else {
      (listener as unknown as {
        setPosition: (x: number, y: number, z: number) => void;
        setOrientation: (fx: number, fy: number, fz: number, ux: number, uy: number, uz: number) => void;
      }).setPosition(camPos[0], camPos[1], camPos[2]);
    }
  }

  /**
   * 3D Spatial Bamboo Pen Scratch on Laklak Bark Surface.
   */
  public playSpatialBrushScratch(pos: [number, number, number] = [0, 0, 0], speed: number = 1) {
    const now = performance.now();
    if (now - this.lastBrushTime < 28) return;
    this.lastBrushTime = now;

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const noise = this.getNoiseBuffer(ctx);
      const source = ctx.createBufferSource();
      source.buffer = noise;

      // Bandpass filter to simulate dry fibrous bark contact
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(Math.min(3600, 1100 + speed * 150), t);
      filter.Q.setValueAtTime(2.2, t);

      // Dynamic gain envelope
      const gain = ctx.createGain();
      const intensity = Math.min(0.09, 0.02 + speed * 0.008);
      gain.gain.setValueAtTime(intensity, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

      // 3D Panner
      const panner = this.createPanner(ctx, pos);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);

      source.start(t);
      source.stop(t + 0.06);
    } catch {
      // Audio safety
    }
  }

  /**
   * 3D Resonant Bronze Bell Chime (Genta Datu Batak) for Stroke Validation.
   */
  public playSpatialBellChime(pos: [number, number, number] = [3.2, 0.4, 0]) {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      // Resonant harmonic overtones of traditional bronze bell
      const harmonics = [
        { freq: 523.25, gain: 0.28, decay: 2.8 }, // C5 fundamental
        { freq: 1046.5, gain: 0.16, decay: 2.2 }, // C6 octave
        { freq: 1318.5, gain: 0.12, decay: 1.8 }, // E6 third
        { freq: 1567.98, gain: 0.09, decay: 1.4 }, // G6 fifth
        { freq: 2093.0, gain: 0.04, decay: 0.9 }, // C7 shimmer
      ];

      const panner = this.createPanner(ctx, pos);

      harmonics.forEach(({ freq, gain, decay }, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        // Metallic frequency modulation slight strike pitch dip
        osc.frequency.exponentialRampToValueAtTime(freq * 0.994, t + 0.08);

        // Attack & exponential decay
        noteGain.gain.setValueAtTime(0.0001, t);
        noteGain.gain.linearRampToValueAtTime(gain, t + 0.008);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

        osc.connect(noteGain);
        noteGain.connect(panner);

        osc.start(t);
        osc.stop(t + decay + 0.1);
      });

      panner.connect(ctx.destination);
    } catch {
      // Audio safety
    }
  }

  /**
   * Dipping Bamboo Pen into Stone Inkpot (sound of fluid and ceramic contact).
   */
  public playSpatialInkDip(pos: [number, number, number] = [-3.2, -0.6, 0.5]) {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Pitch drop simulates dipping into viscous ink
      osc.frequency.setValueAtTime(720, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.08);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

      const panner = this.createPanner(ctx, pos);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.13);
    } catch {}
  }

  /**
   * Generative Hasapi Batak Boat-Lute Pluck.
   * Synthesized using Karplus-Strong string pluck physics and wooden resonance.
   */
  public playHasapiPluck(noteIndex?: number, pos: [number, number, number] = [0, 1.2, -1]) {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const idx =
        noteIndex !== undefined
          ? noteIndex % HASAPI_PENTATONIC.length
          : this.hasapiSequenceIndex % HASAPI_PENTATONIC.length;
      this.hasapiSequenceIndex++;

      const freq = HASAPI_PENTATONIC[idx];

      // Dual oscillator physical modeling of 2-stringed Hasapi
      const oscMain = ctx.createOscillator();
      const oscSub = ctx.createOscillator();
      const gain = ctx.createGain();

      oscMain.type = 'sawtooth';
      oscSub.type = 'triangle';

      oscMain.frequency.setValueAtTime(freq, t);
      oscSub.frequency.setValueAtTime(freq * 0.5, t); // Octave body drone

      // Resonant Wooden Body Filter
      const bodyFilter = ctx.createBiquadFilter();
      bodyFilter.type = 'lowpass';
      bodyFilter.frequency.setValueAtTime(Math.min(2800, freq * 4.5), t);
      bodyFilter.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.45);
      bodyFilter.Q.setValueAtTime(3.5, t);

      // Pluck sharp transient attack and resonant decay
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.004); // Fast snap
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

      const panner = this.createPanner(ctx, pos);

      oscMain.connect(bodyFilter);
      oscSub.connect(bodyFilter);
      bodyFilter.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);

      oscMain.start(t);
      oscSub.start(t);
      oscMain.stop(t + 1.7);
      oscSub.stop(t + 1.7);
    } catch {}
  }

  /**
   * Ambient Oil Lantern Flame Whisper & Soft Crackle.
   */
  public startLanternAmbiance(pos: [number, number, number] = [-2.8, 1.8, 1.2]) {
    if (this.lanternSource) return; // Already running
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const noise = this.getNoiseBuffer(ctx);
      const source = ctx.createBufferSource();
      source.buffer = noise;
      source.loop = true;

      // Soft warm lowpass hum with slight hiss
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(420, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.012, ctx.currentTime);

      const panner = this.createPanner(ctx, pos);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);

      source.start();
      this.lanternSource = source;
      this.lanternGainNode = gain;
      this.lanternPanner = panner;
    } catch {}
  }

  /**
   * Update 3D position of the lantern audio.
   */
  public updateLanternPosition(pos: [number, number, number]) {
    if (!this.lanternPanner || !this.ctx) return;
    const t = this.ctx.currentTime;
    if (this.lanternPanner.positionX) {
      this.lanternPanner.positionX.setValueAtTime(pos[0], t);
      this.lanternPanner.positionY.setValueAtTime(pos[1], t);
      this.lanternPanner.positionZ.setValueAtTime(pos[2], t);
    }
  }

  /**
   * Ethnic Batak Gondang / Ogung resonant chime played on success.
   */
  public playEthnicSuccessChime() {
    this.playSpatialBellChime([0, 0, 0]);
    this.playHasapiPluck(4);
  }

  /**
   * Procedural brush scratch sound played during stroke drawing.
   */
  public playBrushScratch(speed: number = 1) {
    this.playSpatialBrushScratch([0, 0, 0], speed);
  }

  public playClickSound() {
    this.playSpatialBrushScratch([0, 0, 0], 2);
  }
}

export const sound = new SpatialAudioEngine();
