import { Howl, Howler } from 'howler';
import { SaveManager } from './SaveManager';

type SoundKey =
  | 'shoot'
  | 'hit'
  | 'coin'
  | 'explosion'
  | 'levelup'
  | 'boss'
  | 'rare'
  | 'hurt'
  | 'click';

const SAMPLE_RATE = 11025;

/**
 * Kapselt Howler.js. Sämtliche Feedbacksounds werden prozedural als WAV erzeugt
 * (kein Asset-Download nötig -> kleiner Build, < 3 MB Ziel). Jede Aktion erhält
 * eine akustische Rückmeldung (Audio Direction).
 */
class AudioManagerImpl {
  private sounds: Partial<Record<SoundKey, Howl>> = {};
  private music?: Howl;
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.sounds.shoot = this.tone({ freq: 660, dur: 0.06, type: 'square', vol: 0.18, decay: 0.04 });
    this.sounds.hit = this.tone({ freq: 220, dur: 0.05, type: 'square', vol: 0.25, decay: 0.04 });
    this.sounds.coin = this.tone({ freq: 880, dur: 0.09, type: 'sine', vol: 0.25, slideTo: 1320 });
    this.sounds.explosion = this.noise({ dur: 0.25, vol: 0.3, decay: 0.2 });
    this.sounds.levelup = this.arpeggio([523, 659, 784, 1046], 0.08, 0.28);
    this.sounds.boss = this.tone({ freq: 110, dur: 0.6, type: 'sawtooth', vol: 0.35, slideTo: 70 });
    this.sounds.rare = this.arpeggio([784, 988, 1318], 0.1, 0.3);
    this.sounds.hurt = this.tone({ freq: 160, dur: 0.18, type: 'sawtooth', vol: 0.3, slideTo: 90 });
    this.sounds.click = this.tone({ freq: 520, dur: 0.04, type: 'square', vol: 0.2 });

    this.music = this.buildMusic();

    const settings = SaveManager.get().settings;
    Howler.volume(settings.volume);
    Howler.mute(settings.muted);
  }

  play(key: SoundKey): void {
    this.sounds[key]?.play();
  }

  startMusic(): void {
    if (this.music && !this.music.playing()) {
      this.music.play();
    }
  }

  stopMusic(): void {
    this.music?.stop();
  }

  setVolume(v: number): void {
    Howler.volume(v);
    SaveManager.update((d) => (d.settings.volume = v));
  }

  setMuted(muted: boolean): void {
    Howler.mute(muted);
    SaveManager.update((d) => (d.settings.muted = muted));
  }

  isMuted(): boolean {
    return SaveManager.get().settings.muted;
  }

  // --- Synth-Helfer -------------------------------------------------------

  private tone(opts: {
    freq: number;
    dur: number;
    type: 'sine' | 'square' | 'sawtooth';
    vol: number;
    decay?: number;
    slideTo?: number;
  }): Howl {
    const n = Math.floor(SAMPLE_RATE * opts.dur);
    const samples = new Float32Array(n);
    const decay = opts.decay ?? opts.dur;
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      const progress = i / n;
      const freq = opts.slideTo
        ? opts.freq + (opts.slideTo - opts.freq) * progress
        : opts.freq;
      const phase = 2 * Math.PI * freq * t;
      let wave: number;
      switch (opts.type) {
        case 'square':
          wave = Math.sin(phase) >= 0 ? 1 : -1;
          break;
        case 'sawtooth':
          wave = 2 * ((freq * t) % 1) - 1;
          break;
        default:
          wave = Math.sin(phase);
      }
      const env = Math.exp(-t / decay);
      samples[i] = wave * env * opts.vol;
    }
    return this.toHowl(samples);
  }

  private noise(opts: { dur: number; vol: number; decay: number }): Howl {
    const n = Math.floor(SAMPLE_RATE * opts.dur);
    const samples = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t / opts.decay);
      samples[i] = (Math.random() * 2 - 1) * env * opts.vol;
    }
    return this.toHowl(samples);
  }

  private arpeggio(freqs: number[], stepDur: number, vol: number): Howl {
    const n = Math.floor(SAMPLE_RATE * stepDur * freqs.length);
    const samples = new Float32Array(n);
    const stepSamples = Math.floor(SAMPLE_RATE * stepDur);
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      const step = Math.min(freqs.length - 1, Math.floor(i / stepSamples));
      const localT = (i - step * stepSamples) / SAMPLE_RATE;
      const env = Math.exp(-localT / (stepDur * 0.6));
      samples[i] = Math.sin(2 * Math.PI * freqs[step] * t) * env * vol;
    }
    return this.toHowl(samples);
  }

  private buildMusic(): Howl {
    // Ruhiger, kurzer Loop aus weichen Tönen (nicht aufdringlich).
    const notes = [196, 261, 329, 261, 220, 293, 349, 293];
    const stepDur = 0.5;
    const n = Math.floor(SAMPLE_RATE * stepDur * notes.length);
    const samples = new Float32Array(n);
    const stepSamples = Math.floor(SAMPLE_RATE * stepDur);
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      const step = Math.min(notes.length - 1, Math.floor(i / stepSamples));
      const localT = (i - step * stepSamples) / SAMPLE_RATE;
      const env = Math.sin((localT / stepDur) * Math.PI) * 0.12;
      const base = Math.sin(2 * Math.PI * notes[step] * t);
      const fifth = Math.sin(2 * Math.PI * notes[step] * 1.5 * t) * 0.3;
      samples[i] = (base + fifth) * env;
    }
    return new Howl({ src: [this.toWavDataUri(samples)], loop: true, volume: 0.5 });
  }

  private toHowl(samples: Float32Array): Howl {
    return new Howl({ src: [this.toWavDataUri(samples)] });
  }

  private toWavDataUri(samples: Float32Array): string {
    const numSamples = samples.length;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, SAMPLE_RATE, true);
    view.setUint32(28, SAMPLE_RATE * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return 'data:audio/wav;base64,' + btoa(binary);
  }
}

export const AudioManager = new AudioManagerImpl();
