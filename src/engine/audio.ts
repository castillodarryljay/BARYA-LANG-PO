/**
 * 100% Offline Web Audio API Relaxing Lo-Fi / Rainy Piano / Chiptune BGM & SFX Engine.
 * Zero external audio files or network requests.
 */

import type { BgmStyle } from '../types/game';

export type AudioMood = 'chill' | 'rainy' | 'minigame' | 'victory';

class CozyAudioEngine {
  private ctx: AudioContext | null = null;
  private masterBgmGain: GainNode | null = null;
  private bgmFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;

  private bgmVolume = 0.28;
  private sfxVolume = 0.55;
  private bgmStyle: BgmStyle = 'lofi';
  private rainEnabled = false;
  private bgmTimer: number | null = null;
  private step = 0;
  private isPlayingBgm = false;
  private mood: AudioMood = 'chill';

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      // Warm low-pass bus for relaxing lo-fi BGM
      this.bgmFilter = this.ctx.createBiquadFilter();
      this.bgmFilter.type = 'lowpass';
      this.bgmFilter.frequency.setValueAtTime(1650, this.ctx.currentTime);
      this.bgmFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

      this.masterBgmGain = this.ctx.createGain();
      this.masterBgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);

      this.bgmFilter.connect(this.masterBgmGain);
      this.masterBgmGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setVolumes(bgm: number, sfx: number) {
    this.bgmVolume = Math.max(0, Math.min(1, bgm));
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    if (this.masterBgmGain && this.ctx) {
      this.masterBgmGain.gain.setTargetAtTime(this.bgmVolume, this.ctx.currentTime, 0.08);
    }
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setTargetAtTime(
        this.rainEnabled ? Math.max(0.03, this.bgmVolume * 0.24) : 0.0001,
        this.ctx.currentTime,
        0.12
      );
    }
    if (this.bgmVolume <= 0.001) {
      this.stopBgm();
    } else if (!this.isPlayingBgm && this.ctx) {
      this.startBgm(this.mood);
    }
  }

  setBgmStyle(style: BgmStyle) {
    if (this.bgmStyle === style) return;
    this.bgmStyle = style;
    if (this.isPlayingBgm) {
      this.startBgm(this.mood);
    }
  }

  setRainAmbience(enabled: boolean) {
    this.rainEnabled = enabled;
    const ctx = this.ctx;
    if (!ctx) return;
    if (enabled) {
      this.startRainNode(ctx);
    } else {
      this.stopRainNode();
    }
  }

  private startRainNode(ctx: AudioContext) {
    if (this.rainSource) {
      if (this.rainGain) {
        this.rainGain.gain.setTargetAtTime(
          Math.max(0.03, this.bgmVolume * 0.24),
          ctx.currentTime,
          0.15
        );
      }
      return;
    }
    // Synthesize 3 seconds of smooth pink-ish rain noise buffer offline
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 3;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      data[i] = (b0 + b1 + b2 + white * 0.015) * 0.55;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, ctx.currentTime);
    filter.Q.setValueAtTime(0.65, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(
      Math.max(0.03, this.bgmVolume * 0.24),
      ctx.currentTime + 0.6
    );

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();

    this.rainSource = src;
    this.rainGain = gain;
  }

  private stopRainNode() {
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.12);
    }
    if (this.rainSource) {
      try {
        this.rainSource.stop(this.ctx ? this.ctx.currentTime + 0.25 : 0);
      } catch {
        // Ignore already stopped
      }
      this.rainSource = null;
      this.rainGain = null;
    }
  }

  private playSfxTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
    endFreq?: number
  ) {
    const ctx = this.ensureContext();
    if (!ctx || volume <= 0.001) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  /** Warm Rhodes electric piano chord voice routed through low-pass BGM bus */
  private playRhodesNote(freq: number, duration: number, vol: number, delay = 0) {
    const ctx = this.ctx;
    if (!ctx || !this.bgmFilter || vol <= 0.001) return;
    const now = ctx.currentTime + delay;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    // Gentle analog lo-fi warmth detune (+3 cents)
    osc2.frequency.setValueAtTime(freq * 1.0018, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.035);
    gain.gain.exponentialRampToValueAtTime(vol * 0.45, now + duration * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.32, now);

    osc1.connect(gain);
    osc2.connect(g2);
    g2.connect(gain);
    gain.connect(this.bgmFilter);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.04);
    osc2.stop(now + duration + 0.04);
  }

  /** Soft lo-fi brushed kick or shaker pulse */
  private playSoftPerc(kind: 'kick' | 'hat') {
    const ctx = this.ctx;
    if (!ctx || !this.masterBgmGain) return;
    const now = ctx.currentTime;
    if (kind === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(118, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.masterBgmGain);
      osc.start(now);
      osc.stop(now + 0.16);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(4200 + Math.random() * 600, now);
      gain.gain.setValueAtTime(0.022, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
      osc.connect(gain);
      gain.connect(this.masterBgmGain);
      osc.start(now);
      osc.stop(now + 0.045);
    }
  }

  // --- Expressive Sound Effects ---

  playClick() {
    this.playSfxTone(580, 0.05, 'triangle', 0.08 * this.sfxVolume, 0, 440);
  }

  playPageTurn() {
    const v = 0.06 * this.sfxVolume;
    this.playSfxTone(320, 0.06, 'sine', v, 0, 520);
    this.playSfxTone(480, 0.07, 'triangle', v * 0.7, 0.04, 660);
  }

  playBlip() {
    const pitch = 370 + (Math.random() * 55 - 25);
    this.playSfxTone(pitch, 0.028, 'sine', 0.035 * this.sfxVolume);
  }

  playCoin() {
    const v = 0.1 * this.sfxVolume;
    this.playSfxTone(987.77, 0.08, 'triangle', v, 0);
    this.playSfxTone(1318.51, 0.18, 'sine', v, 0.065);
    this.playSfxTone(1975.53, 0.12, 'sine', v * 0.45, 0.11);
  }

  playError() {
    const v = 0.09 * this.sfxVolume;
    this.playSfxTone(210, 0.11, 'triangle', v, 0, 175);
    this.playSfxTone(165, 0.16, 'sine', v, 0.09, 130);
  }

  playSuccess() {
    const v = 0.095 * this.sfxVolume;
    this.playSfxTone(523.25, 0.11, 'triangle', v, 0);
    this.playSfxTone(659.25, 0.11, 'triangle', v, 0.075);
    this.playSfxTone(783.99, 0.22, 'sine', v, 0.15);
  }

  playChallengeWin() {
    const v = 0.11 * this.sfxVolume;
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
    notes.forEach((n, i) => {
      this.playSfxTone(n, i === 4 ? 0.36 : 0.1, 'triangle', v, i * 0.075);
    });
  }

  playFanfare() {
    const v = 0.11 * this.sfxVolume;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((n, i) => {
      this.playSfxTone(n, i === 4 ? 0.45 : 0.13, 'triangle', v, i * 0.11);
    });
  }

  startBgm(mood: AudioMood = 'chill') {
    this.mood = mood;
    if (this.bgmVolume <= 0.001) return;
    if (this.bgmTimer !== null) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }

    const activeStyle: BgmStyle = mood === 'rainy' ? 'rainy' : this.bgmStyle;

    // Warm jazz/lo-fi chord progressions (Cmaj7 -> Am7 -> Fmaj7 -> G6)
    const lofiChords: number[][] = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 329.63], // G6
    ];
    const lofiMelody = [
      659.25, 0, 587.33, 523.25, 0, 493.88, 523.25, 0,
      440.0, 0, 523.25, 659.25, 0, 587.33, 0, 0,
      523.25, 0, 659.25, 783.99, 0, 659.25, 587.33, 0,
      493.88, 0, 587.33, 523.25, 0, 0, 0, 0,
    ];
    const rainyArp = [
      261.63, 329.63, 392.0, 493.88, 392.0, 329.63, 0, 0,
      220.0, 261.63, 329.63, 392.0, 329.63, 261.63, 0, 0,
      174.61, 220.0, 261.63, 329.63, 261.63, 220.0, 0, 0,
      196.0, 246.94, 293.66, 392.0, 293.66, 246.94, 0, 0,
    ];
    const miniLead = [
      523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33,
      523.25, 587.33, 659.25, 783.99, 1046.5, 0, 783.99, 0,
    ];
    const bassRoots = [130.81, 110.0, 87.31, 98.0];

    const tempoMs =
      mood === 'minigame'
        ? 195
        : activeStyle === 'rainy'
          ? 420
          : activeStyle === 'lofi'
            ? 340
            : 270;

    this.isPlayingBgm = true;

    this.bgmTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running' || this.bgmVolume <= 0.001) return;

      const stepInBar = this.step % 8;
      const chordIdx = Math.floor(this.step / 8) % lofiChords.length;
      const chord = lofiChords[chordIdx];

      if (mood === 'minigame') {
        const note = miniLead[this.step % miniLead.length];
        if (note > 0) this.playRhodesNote(note, 0.17, 0.13);
        if (stepInBar % 2 === 0) {
          this.playRhodesNote(bassRoots[chordIdx], 0.25, 0.14);
          this.playSoftPerc(stepInBar % 4 === 0 ? 'kick' : 'hat');
        }
      } else if (activeStyle === 'rainy') {
        // Tender slow rainy-day piano
        if (stepInBar === 0) {
          chord.forEach((n, i) => this.playRhodesNote(n, 2.2, 0.055, i * 0.055));
          this.playRhodesNote(bassRoots[chordIdx], 2.4, 0.08);
        }
        const arp = rainyArp[this.step % rainyArp.length];
        if (arp > 0) {
          this.playRhodesNote(arp * 2, 0.65, 0.045);
        }
      } else if (activeStyle === 'lofi') {
        // Warm cozy lo-fi Filipino study beat
        if (stepInBar === 0) {
          chord.forEach((n, i) => this.playRhodesNote(n, 1.85, 0.06, i * 0.03));
          this.playRhodesNote(bassRoots[chordIdx], 1.7, 0.11);
          this.playSoftPerc('kick');
        } else if (stepInBar === 4) {
          this.playSoftPerc('kick');
        } else if (stepInBar % 2 === 1) {
          this.playSoftPerc('hat');
        }
        const mel = lofiMelody[this.step % lofiMelody.length];
        if (mel > 0) {
          this.playRhodesNote(mel, 0.55, 0.065);
        }
      } else {
        // Classic nostalgic chiptune
        const mel = lofiMelody[this.step % lofiMelody.length];
        if (mel > 0) this.playRhodesNote(mel, 0.24, 0.09);
        if (stepInBar % 2 === 0) {
          this.playRhodesNote(bassRoots[chordIdx], 0.4, 0.1);
        }
      }

      this.step += 1;
    }, tempoMs);
  }

  unlockAndStart(mood: AudioMood = 'chill') {
    const ctx = this.ensureContext();
    if (ctx && this.rainEnabled) {
      this.startRainNode(ctx);
    }
    if (!this.isPlayingBgm || this.mood !== mood) {
      this.startBgm(mood);
    }
  }

  stopBgm() {
    if (this.bgmTimer !== null) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.isPlayingBgm = false;
  }
}

export const soundFX = new CozyAudioEngine();
