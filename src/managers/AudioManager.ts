import { EventBus } from './EventBus';
import type { Rarity } from '../game/cards/CardDefinitions';

// Procedural audio via Web Audio API — no external assets required.
class AudioManagerClass {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private muted = false;

  init(): void {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.6;
    this.masterGain.connect(this.ctx.destination);

    EventBus.on('audio:play', (id) => this.play(id));
  }

  private resume(): void {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  play(id: string): void {
    if (this.muted || !this.ctx) return;
    this.resume();
    switch (id) {
      case 'card_flip':   return this.cardFlip();
      case 'coin_small':  return this.coin(200, 0.3);
      case 'coin_medium': return this.coin(300, 0.4);
      case 'coin_large':  return this.coin(440, 0.6);
      case 'pack_open':   return this.packOpen();
      case 'rare_sting':  return this.rareSting();
      case 'epic_sting':  return this.epicSting();
      case 'legend_sting':return this.legendSting();
      case 'win_fanfare': return this.winFanfare();
    }
  }

  playForRarity(rarity: Rarity): void {
    const map: Record<Rarity, string> = {
      common:    'coin_small',
      uncommon:  'coin_medium',
      rare:      'rare_sting',
      epic:      'epic_sting',
      legendary: 'legend_sting',
    };
    this.play(map[rarity]);
  }

  setMuted(v: boolean): void { this.muted = v; }
  toggleMute(): boolean { this.muted = !this.muted; return this.muted; }

  // ── Synthesis helpers ────────────────────────────────────────────────────

  private cardFlip(): void {
    const { ctx } = this;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(g); g.connect(this.masterGain);
    osc.start(); osc.stop(ctx.currentTime + 0.12);
  }

  private coin(freq: number, vol: number): void {
    const { ctx } = this;
    if (!ctx) return;
    [0, 0.05, 0.1].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq * (1 + i * 0.1);
      g.gain.setValueAtTime(vol, ctx.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.4);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.4);
    });
  }

  private packOpen(): void {
    const { ctx } = this;
    if (!ctx) return;
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 1200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    noise.connect(filter); filter.connect(g); g.connect(this.masterGain);
    noise.start(); noise.stop(ctx.currentTime + 0.3);
  }

  private rareSting(): void {
    const { ctx } = this;
    if (!ctx) return;
    const freqs = [523, 659, 784, 1047];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = f;
      const t = ctx.currentTime + i * 0.06;
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.3);
    });
  }

  private epicSting(): void {
    const { ctx } = this;
    if (!ctx) return;
    const freqs = [330, 415, 494, 659, 831, 988];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      const t = ctx.currentTime + i * 0.05;
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.5);
    });
  }

  private legendSting(): void {
    const { ctx } = this;
    if (!ctx) return;
    // Dramatic rising chord
    const chord = [261, 329, 392, 523, 659, 784];
    chord.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      const t = ctx.currentTime + i * 0.08;
      osc.frequency.setValueAtTime(f * 0.8, t);
      osc.frequency.linearRampToValueAtTime(f, t + 0.2);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.8);
    });
  }

  private winFanfare(): void {
    const { ctx } = this;
    if (!ctx) return;
    const seq = [523, 659, 784, 1047, 1319];
    seq.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const t = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.35);
    });
  }
}

export const AudioManager = new AudioManagerClass();
