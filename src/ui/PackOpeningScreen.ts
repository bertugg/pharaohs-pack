import { Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';
import type { Pack } from '../game/packSystem/PackGenerator';
import { CardComponent } from '../components/CardComponent';
import { CardFlipAnimation } from '../animations/CardFlipAnimation';
import { ParticleSystem } from '../animations/ParticleSystem';
import { EventBus } from '../managers/EventBus';
import { AudioManager } from '../managers/AudioManager';
import { AssetLoader } from '../managers/AssetLoader';
import type { EconomyManager } from '../game/economy/EconomyManager';

// Stack geometry — each card behind the top one peeks out to the right and below
const STACK_X = 0;
const STACK_Y = -50;
const STACK_OFFSET_X = 6;    // x shift per depth step
const STACK_OFFSET_Y = 12;   // y shift per depth step
const STACK_SCALE_STEP = 0.02; // scale decrease per depth step

// Revealed row shown at the bottom of the screen
const TOTAL_CARDS = 5;
const REVEALED_Y = 230;
const REVEALED_SCALE = 0.27;   // 280 × 0.27 ≈ 76 px wide per card
const REVEALED_SPACING = 100;

type Phase = 'idle' | 'flipping' | 'showing' | 'done';

interface Trans { tx: number; ty: number; ts: number }

export class PackOpeningScreen {
  readonly container: Container;
  private economy: EconomyManager;
  private pack: Pack | null = null;

  // stackCards[i] = CardComponent for pack.cards[i]
  // index 0 = first to reveal (visually on top)
  // index 4 = last to reveal (visually deepest)
  private stackCards: CardComponent[] = [];
  private cardLayer!: Container;
  private bgContainer!: Container;
  private revealIndex = 0;
  private phase: Phase = 'idle';

  private particles: ParticleSystem;
  private ticker: Ticker;
  private transitions = new Map<Container, Trans>();

  private balanceLabel!: Text;
  private progressLabel!: Text;
  private hintLabel!: Text;
  private shakeIntensity = 0;
  private shakeDuration = 0;

  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') { e.preventDefault(); this.tryReveal(); }
  };

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
    // Background layer — procedural fallback + optional image sprites
    this.bgContainer = new Container();
    this.container.addChild(this.bgContainer);

    const proceduralBg = new Graphics();
    proceduralBg.rect(-4000, -4000, 8000, 8000).fill({ color: 0x040200, alpha: 0.55 });
    this.bgContainer.addChild(proceduralBg);

    // Atmospheric sand dots (part of fallback bg)
    const atm = new Graphics();
    for (let i = 0; i < 36; i++) {
      atm.circle(
        (Math.random() - 0.5) * 700,
        (Math.random() - 0.5) * 500,
        0.5 + Math.random() * 1.5,
      ).fill({ color: 0x664422, alpha: 0.25 });
    }
    this.bgContainer.addChild(atm);

    // Particles behind cards
    this.container.addChild(this.particles.container);

    // Card layer — sits above particles
    this.cardLayer = new Container();
    this.container.addChild(this.cardLayer);

    // Header UI (above everything)
    const headerBar = new Graphics();
    headerBar.rect(-600, -340, 1200, 50).fill({ color: 0x0d0700, alpha: 0.88 });
    this.container.addChild(headerBar);

    const title = new Text({
      text: 'OPENING PACK',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 18, fill: 0xcc9900, letterSpacing: 6 }),
    });
    title.anchor.set(0.5);
    title.y = -317;
    this.container.addChild(title);

    this.balanceLabel = new Text({
      text: '',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 22, fill: 0xffdd88, fontWeight: 'bold' }),
    });
    this.balanceLabel.anchor.set(0.5);
    this.balanceLabel.x = 190;
    this.balanceLabel.y = -317;
    this.container.addChild(this.balanceLabel);

    this.progressLabel = new Text({
      text: '',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fill: 0x886644, align: 'center' }),
    });
    this.progressLabel.anchor.set(0.5);
    this.progressLabel.y = -280;
    this.container.addChild(this.progressLabel);

    this.hintLabel = new Text({
      text: 'TAP  OR  SPACE  TO  REVEAL',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 12, fill: 0xcc9900, letterSpacing: 3 }),
    });
    this.hintLabel.anchor.set(0.5);
    this.hintLabel.y = 310;
    this.container.addChild(this.hintLabel);

    this.container.eventMode = 'static';
    this.container.on('pointerdown', () => this.tryReveal());
  }

  // Position for a card at a given depth in the stack (0 = top/front)
  private stackPos(depth: number): { x: number; y: number; s: number } {
    return {
      x: STACK_X + depth * STACK_OFFSET_X,
      y: STACK_Y + depth * STACK_OFFSET_Y,
      s: 1 - depth * STACK_SCALE_STEP,
    };
  }

  // Final resting position in the revealed row at the bottom
  private revealedPos(cardIndex: number): { x: number; y: number } {
    return {
      x: (cardIndex - (TOTAL_CARDS - 1) / 2) * REVEALED_SPACING,
      y: REVEALED_Y,
    };
  }

  async setPack(pack: Pack): Promise<void> {
    this.pack = pack;
    this.revealIndex = 0;
    this.phase = 'idle';
    this.transitions.clear();

    for (const c of this.stackCards) c.destroy();
    this.stackCards = [];
    this.cardLayer.removeChildren();

    // Preload card back + all card artwork textures in parallel
    const [backTex, ...artTextures] = await Promise.all([
      AssetLoader.loadCardBack(),
      ...pack.cards.map(c => AssetLoader.loadCardArt(c.id)),
    ]);

    // Sort lowest → highest so the best card is revealed last.
    // Pair each card with its texture so they stay in sync after sorting.
    const RARITY_ORDER: Record<string, number> = {
      common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4,
    };
    const sorted = pack.cards
      .map((card, i) => ({ card, tex: artTextures[i] }))
      .sort((a, b) =>
        RARITY_ORDER[a.card.rarity] - RARITY_ORDER[b.card.rarity]
        || a.card.payout - b.card.payout,
      );

    // Add cards deepest-first so the top card (index 0) renders last → on top.
    // sorted[4] = last to reveal = deepest in stack (added first, renders at back).
    // sorted[0] = first to reveal = top of stack (added last, renders on top).
    for (let i = sorted.length - 1; i >= 0; i--) {
      const comp = new CardComponent(backTex);
      comp.assignCard(sorted[i].card);
      comp.setCardTexture(sorted[i].tex);
      const pos = this.stackPos(i);
      comp.container.x = pos.x;
      comp.container.y = pos.y;
      comp.container.scale.set(pos.s);
      this.cardLayer.addChild(comp.container);
      this.stackCards[i] = comp;
    }

    // Keep a local reference so startReveal reads the sorted order
    this.pack = { ...pack, cards: sorted.map(s => s.card) };

    this.updateProgress();
    this.hintLabel.visible = true;
    this.hintLabel.alpha = 1;
    this.balanceLabel.text = `$${this.economy.balance.toFixed(2)}`;
    AudioManager.play('pack_open');
    this.ticker.start();
  }

  private tryReveal(): void {
    if (this.phase !== 'idle') return;
    if (!this.pack || this.revealIndex >= this.pack.cards.length) return;
    this.phase = 'flipping';
    this.hintLabel.visible = false;
    this.startReveal();
  }

  private startReveal(): void {
    const idx = this.revealIndex;
    const card = this.pack!.cards[idx];
    const comp = this.stackCards[idx];

    const delay = card.rarity === 'legendary' ? 1100
      : card.rarity === 'epic' ? 500 : 0;

    if (card.rarity === 'legendary') this.flashDark();
    if (card.rarity === 'epic') this.screenPulse(0.3);

    setTimeout(() => {
      AudioManager.play('card_flip');

      const anim = new CardFlipAnimation(comp.container, card.rarity);
      anim
        .onHalf(() => {
          comp.revealFront();
          AudioManager.playForRarity(card.rarity);
          this.particles.burstForRarity(comp.container.x, comp.container.y, card.rarity);
        })
        .onDone(() => {
          this.economy.awardCard(card.payout);
          EventBus.emit('card:revealed', { index: idx, card });

          if (card.rarity === 'legendary') { this.shakeIntensity = 8; this.shakeDuration = 0.6; }
          else if (card.rarity === 'epic')  { this.shakeIntensity = 4; this.shakeDuration = 0.35; }
          else if (card.rarity === 'rare')  { this.shakeIntensity = 2; this.shakeDuration = 0.2; }

          comp.animatePayout(() => {
            if (card.rarity === 'epic' || card.rarity === 'legendary') comp.animateGlowPulse();
            this.phase = 'showing';

            // Auto-advance after a rarity-scaled pause
            const pause = card.rarity === 'legendary' ? 1600
              : card.rarity === 'epic' ? 1300
              : card.rarity === 'rare' ? 1000
              : 533; // common/uncommon: 800ms ÷ 1.5
            setTimeout(() => this.exitCard(), pause);
          });
        });

      const tickFn = (t: Ticker) => {
        anim.update(t.deltaTime / 60);
        if (anim.isDone) this.ticker.remove(tickFn);
      };
      this.ticker.add(tickFn);
      anim.start();
    }, delay);
  }

  // Slide the current card to the bottom row and shift remaining stack cards forward
  private exitCard(): void {
    const idx = this.revealIndex;
    const comp = this.stackCards[idx];

    // Exit revealed card → bottom row position
    const rpos = this.revealedPos(idx);
    this.transitions.set(comp.container, { tx: rpos.x, ty: rpos.y, ts: REVEALED_SCALE });

    // Shift remaining cards one depth step closer to the front
    const remaining = (this.pack?.cards.length ?? TOTAL_CARDS) - idx - 1;
    for (let d = 1; d <= remaining; d++) {
      const nextComp = this.stackCards[idx + d];
      const npos = this.stackPos(d - 1); // was depth d, becomes depth d-1
      this.transitions.set(nextComp.container, { tx: npos.x, ty: npos.y, ts: npos.s });
    }

    // Advance state once the transition is mostly done
    setTimeout(() => {
      this.revealIndex++;
      this.updateProgress();

      if (this.revealIndex >= (this.pack?.cards.length ?? 0)) {
        this.phase = 'done';
        setTimeout(() => {
          AudioManager.play('win_fanfare');
          EventBus.emit('pack:complete', { totalPayout: this.pack!.totalPayout });
          EventBus.emit('screen:results', undefined);
        }, 400);
      } else {
        this.phase = 'idle';
        this.fadeInHint();
      }
    }, 450);
  }

  private fadeInHint(): void {
    this.hintLabel.visible = true;
    this.hintLabel.alpha = 0;
    const step = () => {
      this.hintLabel.alpha = Math.min(this.hintLabel.alpha + 0.06, 1);
      if (this.hintLabel.alpha < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  private updateProgress(): void {
    const total = this.pack?.cards.length ?? TOTAL_CARDS;
    let s = '';
    for (let i = 0; i < total; i++) s += (i < this.revealIndex ? '◆' : '◇') + (i < total - 1 ? ' ' : '');
    this.progressLabel.text = s;
  }

  // ── Visual effects ────────────────────────────────────────────────────────

  private flashDark(): void {
    const ov = new Graphics();
    ov.rect(-600, -400, 1200, 800).fill({ color: 0x000000, alpha: 0 });
    this.container.addChild(ov);
    let a = 0; let dir = 1;
    const f = () => {
      a += 0.06 * dir; if (a >= 0.88) dir = -1;
      ov.clear().rect(-600, -400, 1200, 800).fill({ color: 0x000000, alpha: Math.max(0, a) });
      if (a > 0 || dir === 1) requestAnimationFrame(f);
      else { this.container.removeChild(ov); ov.destroy(); }
    };
    requestAnimationFrame(f);
  }

  private screenPulse(intensity: number): void {
    const ov = new Graphics();
    ov.rect(-600, -400, 1200, 800).fill({ color: 0xffffff, alpha: intensity });
    this.container.addChild(ov);
    let a = intensity;
    const f = () => {
      a -= 0.04;
      ov.clear().rect(-600, -400, 1200, 800).fill({ color: 0xffffff, alpha: Math.max(0, a) });
      if (a > 0) requestAnimationFrame(f);
      else { this.container.removeChild(ov); ov.destroy(); }
    };
    requestAnimationFrame(f);
  }

  // ── Tick ─────────────────────────────────────────────────────────────────

  private onTick(ticker: Ticker): void {
    const dt = ticker.deltaTime / 60;

    // Lerp all active position transitions
    const done: Container[] = [];
    for (const [c, t] of this.transitions) {
      c.x += (t.tx - c.x) * 8 * dt;
      c.y += (t.ty - c.y) * 8 * dt;
      const s = c.scale.x + (t.ts - c.scale.x) * 8 * dt;
      c.scale.set(s);
      if (Math.abs(c.x - t.tx) < 0.5 && Math.abs(c.y - t.ty) < 0.5 && Math.abs(c.scale.x - t.ts) < 0.005) {
        c.x = t.tx; c.y = t.ty; c.scale.set(t.ts); done.push(c);
      }
    }
    done.forEach((c) => this.transitions.delete(c));

    // Screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const si = this.shakeIntensity * Math.max(0, this.shakeDuration / 0.6);
      this.container.x = (Math.random() - 0.5) * si * 2;
      this.container.y = (Math.random() - 0.5) * si * 2;
      if (this.shakeDuration <= 0) { this.container.x = 0; this.container.y = 0; }
    }

    // Hint pulse when waiting
    if (this.hintLabel.visible && this.phase === 'idle') {
      this.hintLabel.alpha = 0.55 + 0.45 * Math.sin(performance.now() / 400);
    }

    this.particles.update(dt);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  show(): void {
    this.container.visible = true;
    window.addEventListener('keydown', this.onKeyDown);
  }

  hide(): void {
    this.container.visible = false;
    window.removeEventListener('keydown', this.onKeyDown);
  }

  destroy(): void {
    this.ticker.stop();
    this.ticker.destroy();
    this.particles.destroy();
    window.removeEventListener('keydown', this.onKeyDown);
    for (const c of this.stackCards) c.destroy();
    this.container.destroy({ children: true });
  }
}
