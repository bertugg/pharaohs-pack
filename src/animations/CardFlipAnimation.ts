import { Container } from 'pixi.js';
import type { Rarity } from '../game/cards/CardDefinitions';

export type FlipPhase = 'idle' | 'lift' | 'flip-first-half' | 'flip-second-half' | 'settle' | 'done';

interface FlipConfig {
  liftDuration: number;    // seconds to float forward
  flipDuration: number;    // seconds for full flip
  settleDuration: number;  // seconds to land back
}

const RARITY_TIMING: Record<Rarity, FlipConfig> = {
  common:    { liftDuration: 0.25, flipDuration: 0.40, settleDuration: 0.20 },
  uncommon:  { liftDuration: 0.30, flipDuration: 0.45, settleDuration: 0.20 },
  rare:      { liftDuration: 0.40, flipDuration: 0.55, settleDuration: 0.25 },
  epic:      { liftDuration: 0.50, flipDuration: 0.65, settleDuration: 0.30 },
  legendary: { liftDuration: 0.80, flipDuration: 0.80, settleDuration: 0.40 },
};

// Easing functions
const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export class CardFlipAnimation {
  private phase: FlipPhase = 'idle';
  private elapsed = 0;
  private cfg: FlipConfig;
  private onHalfCallback: (() => void) | null = null;
  private onDoneCallback: (() => void) | null = null;
  private baseY: number;
  private baseScale: number;
  private cardHalfSwitched = false;

  constructor(
    private readonly target: Container,
    rarity: Rarity,
  ) {
    this.cfg = RARITY_TIMING[rarity];
    this.baseY = target.y;
    this.baseScale = target.scale.x;
  }

  /** onHalf fires at the midpoint of the flip — swap card face here. */
  onHalf(cb: () => void): this { this.onHalfCallback = cb; return this; }
  onDone(cb: () => void): this  { this.onDoneCallback = cb; return this; }

  start(): void {
    this.phase = 'lift';
    this.elapsed = 0;
    this.cardHalfSwitched = false;
  }

  /** Call every frame with delta time in seconds. */
  update(dt: number): void {
    if (this.phase === 'idle' || this.phase === 'done') return;
    this.elapsed += dt;

    switch (this.phase) {
      case 'lift': {
        const t = Math.min(this.elapsed / this.cfg.liftDuration, 1);
        const e = easeOut(t);
        this.target.y = this.baseY - 40 * e;
        this.target.scale.set(this.baseScale + 0.08 * e);
        if (t >= 1) { this.phase = 'flip-first-half'; this.elapsed = 0; }
        break;
      }
      case 'flip-first-half': {
        const halfDur = this.cfg.flipDuration / 2;
        const t = Math.min(this.elapsed / halfDur, 1);
        // scaleX goes from 1 → 0 (first half of "flip")
        this.target.scale.x = (this.baseScale + 0.08) * (1 - easeInOut(t));
        if (t >= 1) {
          this.target.scale.x = 0;
          if (!this.cardHalfSwitched) {
            this.cardHalfSwitched = true;
            this.onHalfCallback?.();
          }
          this.phase = 'flip-second-half';
          this.elapsed = 0;
        }
        break;
      }
      case 'flip-second-half': {
        const halfDur = this.cfg.flipDuration / 2;
        const t = Math.min(this.elapsed / halfDur, 1);
        // scaleX goes from 0 → 1 (reveal side)
        this.target.scale.x = (this.baseScale + 0.08) * easeInOut(t);
        if (t >= 1) { this.phase = 'settle'; this.elapsed = 0; }
        break;
      }
      case 'settle': {
        const t = Math.min(this.elapsed / this.cfg.settleDuration, 1);
        const e = easeOut(t);
        const sc = (this.baseScale + 0.08) - 0.08 * e;
        this.target.scale.set(sc);
        this.target.y = (this.baseY - 40) + 40 * e;
        if (t >= 1) {
          this.target.y = this.baseY;
          this.target.scale.set(this.baseScale);
          this.phase = 'done';
          this.onDoneCallback?.();
        }
        break;
      }
    }
  }

  get isDone(): boolean { return this.phase === 'done'; }
}
