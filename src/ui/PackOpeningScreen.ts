import { Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';
import type { Pack } from '../game/packSystem/PackGenerator';
import { CardComponent } from '../components/CardComponent';
import { CardFlipAnimation } from '../animations/CardFlipAnimation';
import { ParticleSystem } from '../animations/ParticleSystem';
import { EventBus } from '../managers/EventBus';
import { AudioManager } from '../managers/AudioManager';
import type { EconomyManager } from '../game/economy/EconomyManager';

const SLOT_SPACING = 150;

type ScreenPhase = 'waiting' | 'revealing' | 'done';

export class PackOpeningScreen {
  readonly container: Container;
  private cardSlots: CardComponent[] = [];
  private particles: ParticleSystem;
  private balanceLabel!: Text;
  private progressLabel!: Text;
  private revealIndex = 0;
  private pack: Pack | null = null;
  private phase: ScreenPhase = 'waiting';
  private economy: EconomyManager;
  private ticker: Ticker;
  private screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
  private tapHint!: Text;

  constructor(economy: EconomyManager) {
    this.economy = economy;
    this.container = new Container();
    this.particles = new ParticleSystem();
    this.ticker = new Ticker();
    this.ticker.add(this.onTick.bind(this));
    this.build();

    EventBus.on('balance:changed', (bal) => {
      if (this.balanceLabel) this.balanceLabel.text = `$${bal.toFixed(2)}`;
    });
  }

  private build(): void {
    // Atmospheric background
    const bg = new Graphics();
    bg.rect(-500, -500, 1000, 1000).fill(0x080400);
    this.container.addChild(bg);

    // Sand particle bg layer (static decorative)
    const sandBg = new Graphics();
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * 800;
      const y = (Math.random() - 0.5) * 600;
      sandBg.circle(x, y, 1 + Math.random() * 2).fill({ color: 0x664422, alpha: 0.3 });
    }
    this.container.addChild(sandBg);

    // Header
    const headerBg = new Graphics();
    headerBg.rect(-500, -340, 1000, 50).fill({ color: 0x0d0700, alpha: 0.8 });
    this.container.addChild(headerBg);

    const title = new Text({
      text: 'OPENING PACK',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 18,
        fill: 0xcc9900,
        letterSpacing: 6,
      }),
    });
    title.anchor.set(0.5);
    title.y = -318;
    this.container.addChild(title);

    // Balance display
    this.balanceLabel = new Text({
      text: `$${this.economy.balance.toFixed(2)}`,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 22,
        fill: 0xffdd88,
        fontWeight: 'bold',
      }),
    });
    this.balanceLabel.anchor.set(0.5);
    this.balanceLabel.y = -318;
    this.balanceLabel.x = 180;
    this.container.addChild(this.balanceLabel);

    // Progress dots
    this.progressLabel = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        fill: 0x886644,
        align: 'center',
      }),
    });
    this.progressLabel.anchor.set(0.5);
    this.progressLabel.y = -275;
    this.container.addChild(this.progressLabel);

    // Tap hint
    this.tapHint = new Text({
      text: 'TAP TO REVEAL',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 14,
        fill: 0xcc9900,
        letterSpacing: 3,
      }),
    });
    this.tapHint.anchor.set(0.5);
    this.tapHint.y = 250;
    this.container.addChild(this.tapHint);

    // Particle system on top
    this.container.addChild(this.particles.container);

    // Interactive: tap anywhere to reveal next card
    this.container.eventMode = 'static';
    this.container.on('pointerdown', () => this.tryRevealNext());
  }

  setPack(pack: Pack): void {
    this.pack = pack;
    this.revealIndex = 0;
    this.phase = 'waiting';

    // Clear old cards
    for (const slot of this.cardSlots) slot.destroy();
    this.cardSlots = [];

    const totalW = (pack.cards.length - 1) * SLOT_SPACING;
    const startX = -totalW / 2;

    for (let i = 0; i < pack.cards.length; i++) {
      const comp = new CardComponent();
      comp.assignCard(pack.cards[i]);
      comp.container.x = startX + i * SLOT_SPACING;
      comp.container.y = 20;
      comp.container.scale.set(1);
      this.container.addChildAt(comp.container, this.container.children.length - 1);
      this.cardSlots.push(comp);
    }

    this.updateProgressDots();
    this.tapHint.visible = true;
    this.tapHint.alpha = 1;
    AudioManager.play('pack_open');
    this.ticker.start();
  }

  private tryRevealNext(): void {
    if (this.phase !== 'waiting') return;
    if (this.revealIndex >= (this.pack?.cards.length ?? 0)) return;

    this.phase = 'revealing';
    this.tapHint.visible = false;
    this.revealCard(this.revealIndex);
  }

  private revealCard(index: number): void {
    const card = this.pack!.cards[index];
    const comp = this.cardSlots[index];

    EventBus.emit('card:reveal', { index, card });

    // Anticipation pause for rare+
    const delay = card.rarity === 'legendary' ? 1200
      : card.rarity === 'epic' ? 600
      : 0;

    // Flash screen for legendary
    if (card.rarity === 'legendary') this.flashDark();
    if (card.rarity === 'epic') this.screenPulse(0.3);

    setTimeout(() => {
      AudioManager.play('card_flip');

      const anim = new CardFlipAnimation(comp.container, card.rarity);
      anim
        .onHalf(() => {
          comp.revealFront();
          AudioManager.playForRarity(card.rarity);
        })
        .onDone(() => {
          // Particles at card center
          const wx = comp.container.x;
          const wy = comp.container.y;
          this.particles.burstForRarity(wx, wy, card.rarity);

          // Screen shake for epic/legendary
          if (card.rarity === 'legendary') this.startShake(8, 0.6);
          else if (card.rarity === 'epic') this.startShake(4, 0.35);
          else if (card.rarity === 'rare') this.startShake(2, 0.2);

          // Payout reveal
          comp.animatePayout(() => {
            if (card.rarity === 'epic' || card.rarity === 'legendary') comp.animateGlowPulse();

            // Award and advance
            this.economy.awardCard(card.payout);
            EventBus.emit('card:revealed', { index, card });
            this.revealIndex++;
            this.updateProgressDots();

            if (this.revealIndex < (this.pack?.cards.length ?? 0)) {
              this.phase = 'waiting';
              this.showTapHint();
            } else {
              // All cards revealed
              setTimeout(() => this.onAllRevealed(), 800);
            }
          });
        });

      // Attach animation to ticker
      const tickId = this.ticker.add((t: Ticker) => {
        anim.update(t.deltaTime / 60);
        if (anim.isDone) this.ticker.remove(tickId as unknown as Parameters<typeof this.ticker.remove>[0]);
      });
      anim.start();
    }, delay);
  }

  private showTapHint(): void {
    this.tapHint.visible = true;
    this.tapHint.alpha = 0;
    let t = 0;
    const fade = () => {
      t += 0.05;
      this.tapHint.alpha = Math.min(t, 1);
      if (t < 1) requestAnimationFrame(fade);
    };
    requestAnimationFrame(fade);
  }

  private onAllRevealed(): void {
    this.phase = 'done';
    this.tapHint.visible = false;
    AudioManager.play('win_fanfare');
    EventBus.emit('pack:complete', { totalPayout: this.pack!.totalPayout });
    EventBus.emit('screen:results', undefined);
  }

  private updateProgressDots(): void {
    const total = this.pack?.cards.length ?? 5;
    let dots = '';
    for (let i = 0; i < total; i++) {
      dots += i < this.revealIndex ? '◆ ' : '◇ ';
    }
    this.progressLabel.text = dots.trim();
  }

  // ── Effects ──────────────────────────────────────────────────────────────

  private flashDark(): void {
    const overlay = new Graphics();
    overlay.rect(-500, -500, 1000, 1000).fill({ color: 0x000000, alpha: 0 });
    this.container.addChild(overlay);
    let alpha = 0;
    let dir = 1;
    let frames = 0;
    const f = () => {
      frames++;
      alpha += 0.06 * dir;
      if (alpha >= 0.85) dir = -1;
      overlay.clear().rect(-500, -500, 1000, 1000).fill({ color: 0x000000, alpha: Math.max(0, alpha) });
      if (alpha > 0 || frames < 5) requestAnimationFrame(f);
      else { this.container.removeChild(overlay); overlay.destroy(); }
    };
    requestAnimationFrame(f);
  }

  private screenPulse(intensity: number): void {
    const overlay = new Graphics();
    overlay.rect(-500, -500, 1000, 1000).fill({ color: 0xffffff, alpha: intensity });
    this.container.addChild(overlay);
    let a = intensity;
    const f = () => {
      a -= 0.04;
      overlay.clear().rect(-500, -500, 1000, 1000).fill({ color: 0xffffff, alpha: Math.max(0, a) });
      if (a > 0) requestAnimationFrame(f);
      else { this.container.removeChild(overlay); overlay.destroy(); }
    };
    requestAnimationFrame(f);
  }

  private startShake(intensity: number, duration: number): void {
    this.screenShake = { x: 0, y: 0, intensity, duration };
  }

  private onTick(ticker: Ticker): void {
    const dt = ticker.deltaTime / 60;

    // Screen shake
    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= dt;
      const i = this.screenShake.intensity * (this.screenShake.duration / 0.6);
      this.container.x = (Math.random() - 0.5) * i * 2;
      this.container.y = (Math.random() - 0.5) * i * 2;
    } else {
      this.container.x = 0;
      this.container.y = 0;
    }

    // Tap hint pulse
    if (this.tapHint.visible) {
      const time = performance.now() / 1000;
      this.tapHint.alpha = 0.6 + 0.4 * Math.sin(time * 3);
    }

    this.particles.update(dt);
  }

  show(): void { this.container.visible = true; }
  hide(): void { this.container.visible = false; }

  destroy(): void {
    this.ticker.stop();
    this.ticker.destroy();
    this.particles.destroy();
    for (const s of this.cardSlots) s.destroy();
    this.container.destroy({ children: true });
  }
}
