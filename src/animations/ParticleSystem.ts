import { Container, Graphics, type ColorSource } from 'pixi.js';
import type { Rarity } from '../game/cards/CardDefinitions';

interface Particle {
  gfx: Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
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

  /**
   * minSize / maxSize: individual particle radii (small — firework sparks).
   * High speed + friction produces a wide firework spread area.
   */
  burst(
    x: number, y: number,
    count: number,
    color: ColorSource,
    speed = 1,
    lifeSeconds = 1.5,
    minSize = 5,
    maxSize = 14,
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const spd   = (400 + Math.random() * 350) * speed;
      const size  = minSize + Math.random() * (maxSize - minSize);
      const life  = lifeSeconds * (0.7 + Math.random() * 0.6);

      const gfx = new Graphics();
      const r = Math.random();
      if (r < 0.35) {
        // elongated spark — looks like a firework trail
        gfx.star(0, 0, 4, size, size * 0.25).fill(color);
      } else if (r < 0.65) {
        gfx.star(0, 0, 6, size, size * 0.40).fill(color);
      } else {
        gfx.circle(0, 0, size * 0.65).fill(color);
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
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 6,
      });
    }
    this._active = true;
  }

  burstForRarity(x: number, y: number, rarity: Rarity): void {
    switch (rarity) {
      case 'common':
        this.burst(x, y,  50, 0x888888, 0.9, 1.5,  5, 12);
        setTimeout(() => this.burst(x, y, 25, 0xbbbbbb, 0.6, 1.2,  4, 10), 80);
        break;

      case 'uncommon':
        this.burst(x, y,  90, 0x00cc44, 1.1, 1.8,  6, 15);
        setTimeout(() => this.burst(x, y, 45, 0x88ffaa, 0.8, 1.5,  5, 12), 70);
        setTimeout(() => this.burst(x, y, 35, 0x00ff66, 1.4, 1.4,  5, 11), 140);
        break;

      case 'rare':
        this.burst(x, y, 130, 0x0088ff, 1.3, 2.1,  7, 17);
        setTimeout(() => this.burst(x, y,  65, 0x88ddff, 1.0, 1.7,  6, 14),  70);
        setTimeout(() => this.burst(x, y,  45, 0xffffff, 1.6, 1.4,  5, 12), 140);
        setTimeout(() => this.burst(x, y,  35, 0x0044cc, 1.9, 1.8,  7, 15), 210);
        break;

      case 'epic':
        this.burst(x, y, 200, 0xaa00ff, 1.6, 2.25,  9, 20);
        setTimeout(() => this.burst(x, y, 100, 0xee88ff, 1.2, 2.0,  7, 17),  60);
        setTimeout(() => this.burst(x, y,  70, 0xffffff, 1.5, 1.7,  6, 14), 120);
        setTimeout(() => this.burst(x, y,  65, 0x6600bb, 2.1, 2.1,  8, 19), 180);
        setTimeout(() => this.burst(x, y,  50, 0xff44ff, 1.0, 2.4,  7, 16), 260);
        break;

      case 'legendary':
        this.burst(x, y, 300, 0xffaa00, 2.1, 3.3, 11, 26);
        setTimeout(() => this.burst(x, y, 140, 0xffee44, 1.6, 2.85,  9, 22),  60);
        setTimeout(() => this.burst(x, y, 100, 0xffffff, 2.0, 2.4,   8, 18), 120);
        setTimeout(() => this.burst(x, y,  90, 0xff6600, 2.5, 2.55, 10, 24), 180);
        setTimeout(() => this.burst(x, y,  80, 0xffcc00, 1.2, 3.6,   8, 20), 280);
        setTimeout(() => this.burst(x, y,  60, 0xffffff, 2.8, 2.0,   7, 16), 380);
        break;
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
      const t = p.life / p.maxLife;        // 1 → 0
      p.vx *= 0.96;
      p.vy  = p.vy * 0.96 + 70 * dt;      // firework gravity
      p.gfx.x += p.vx * dt;
      p.gfx.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;
      p.gfx.rotation = p.rotation;
      p.gfx.alpha = t * t;                 // fade accelerates near end
      p.gfx.scale.set(t);                  // linear shrink keeps sparks tight
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
