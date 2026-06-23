import { Container, Graphics, type ColorSource } from 'pixi.js';
import type { Rarity } from '../game/cards/CardDefinitions';

interface Particle {
  gfx: Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  rotation: number;
  rotSpeed: number;
}

export class ParticleSystem {
  readonly container: Container;
  private particles: Particle[] = [];
  private _active = false;

  constructor() {
    this.container = new Container();
  }

  burst(
    x: number, y: number,
    count: number,
    color: ColorSource,
    speed = 1,
    lifeMultiplier = 1,
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
      const spd = (80 + Math.random() * 120) * speed;
      const size = 3 + Math.random() * 5;
      const life = (0.6 + Math.random() * 0.6) * lifeMultiplier;

      const gfx = new Graphics();
      // Mix between circle and diamond shape for variety
      if (Math.random() > 0.5) {
        gfx.star(0, 0, 4, size, size * 0.4).fill(color);
      } else {
        gfx.circle(0, 0, size * 0.6).fill(color);
      }
      gfx.x = x;
      gfx.y = y;

      this.container.addChild(gfx);
      this.particles.push({
        gfx,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life,
        maxLife: life,
        size,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 8,
      });
    }
    this._active = true;
  }

  burstForRarity(x: number, y: number, rarity: Rarity): void {
    const configs: Record<Rarity, { count: number; color: ColorSource; speed: number; life: number }> = {
      common:    { count: 8,  color: 0xcccccc, speed: 0.5, life: 0.6 },
      uncommon:  { count: 16, color: 0x00ff66, speed: 0.8, life: 0.8 },
      rare:      { count: 28, color: 0x44aaff, speed: 1.0, life: 1.0 },
      epic:      { count: 44, color: 0xcc44ff, speed: 1.3, life: 1.2 },
      legendary: { count: 72, color: 0xffcc00, speed: 1.6, life: 1.8 },
    };
    const cfg = configs[rarity];
    this.burst(x, y, cfg.count, cfg.color, cfg.speed, cfg.life);

    // Legendary gets extra golden trails
    if (rarity === 'legendary') {
      setTimeout(() => this.burst(x, y, 30, 0xffffff, 0.8, 1.2), 80);
      setTimeout(() => this.burst(x, y, 20, 0xff8800, 1.2, 1.0), 160);
    }
    if (rarity === 'epic') {
      setTimeout(() => this.burst(x, y, 20, 0xffffff, 0.7, 0.8), 80);
    }
  }

  update(dt: number): void {
    if (!this._active) return;
    const dead: Particle[] = [];

    for (const p of this.particles) {
      p.life -= dt;
      if (p.life <= 0) {
        dead.push(p);
        continue;
      }
      const t = p.life / p.maxLife;
      p.vx *= 0.96;
      p.vy = p.vy * 0.96 + 60 * dt; // gravity
      p.gfx.x += p.vx * dt;
      p.gfx.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;
      p.gfx.rotation = p.rotation;
      p.gfx.alpha = t;
      p.gfx.scale.set(t);
    }

    for (const p of dead) {
      this.container.removeChild(p.gfx);
      p.gfx.destroy();
      this.particles.splice(this.particles.indexOf(p), 1);
    }

    if (this.particles.length === 0) this._active = false;
  }

  get active(): boolean { return this._active; }

  destroy(): void {
    for (const p of this.particles) {
      this.container.removeChild(p.gfx);
      p.gfx.destroy();
    }
    this.particles = [];
    this.container.destroy({ children: true });
  }
}
