import { Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import type { Pack } from '../game/packSystem/PackGenerator';
import { RARITY_CONFIG } from '../game/cards/CardDefinitions';
import { EventBus } from '../managers/EventBus';
import type { EconomyManager } from '../game/economy/EconomyManager';
import { PACK_PRICE } from '../game/math/RTPModel';
import { ParticleSystem } from '../animations/ParticleSystem';
import { AudioManager } from '../managers/AudioManager';
import { AssetLoader } from '../managers/AssetLoader';

const ROW_H      = 32;   // half = 16 above/below center
const ROW_SPACE  = 35;   // half of old 70 → ~3 px gap between rows

export class ResultScreen {
  readonly container: Container;
  private economy: EconomyManager;
  private particles: ParticleSystem;
  private contentLayer!: Container;

  constructor(economy: EconomyManager) {
    this.economy = economy;
    this.particles = new ParticleSystem();
    this.container = new Container();
    this.container.addChild(this.particles.container);
  }

  async showResults(pack: Pack): Promise<void> {
    // Clear old content
    if (this.contentLayer) {
      this.container.removeChild(this.contentLayer);
      this.contentLayer.destroy({ children: true });
    }
    this.contentLayer = new Container();
    this.container.addChild(this.contentLayer);

    const W = 400;
    const H = 620;

    // Sort in the same order cards were revealed: lowest rarity/value first
    const RARITY_ORDER: Record<string, number> = {
      common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4,
    };
    const sortedCards = [...pack.cards].sort((a, b) =>
      RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.payout - b.payout,
    );

    // Preload all card art (already cached from pack opening — fast)
    const artTextures = await Promise.all(sortedCards.map(c => AssetLoader.loadCardArt(c.id)));

    // Background
    const bg = new Graphics();
    bg.roundRect(-W / 2, -H / 2, W, H, 20).fill({ color: 0x0d0700, alpha: 0.97 });
    bg.roundRect(-W / 2, -H / 2, W, H, 20).stroke({ color: 0x886600, width: 2 });
    this.contentLayer.addChild(bg);

    // Header
    const winRatio = pack.totalPayout / PACK_PRICE;
    const headerColor = winRatio >= 2 ? 0xffcc00
      : winRatio >= 1 ? 0x00cc44
      : 0xcc6600;

    const header = new Text({
      text: winRatio >= 2 ? '🏆 BIG WIN!' : winRatio >= 1 ? 'YOU PROFIT!' : 'PACK OPENED',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 26,
        fill: headerColor,
        fontWeight: 'bold',
        letterSpacing: 3,
        dropShadow: { color: headerColor, blur: 16, distance: 0, angle: 0 },
      }),
    });
    header.anchor.set(0.5);
    header.y = -H / 2 + 44;
    this.contentLayer.addChild(header);

    // Total won display
    const wonBg = new Graphics();
    wonBg.roundRect(-100, -H / 2 + 75, 200, 60, 10).fill({ color: 0x1a0d00, alpha: 0.9 });
    wonBg.roundRect(-100, -H / 2 + 75, 200, 60, 10).stroke({ color: headerColor, width: 2 });
    this.contentLayer.addChild(wonBg);

    const wonLabel = new Text({
      text: 'TOTAL WIN',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 10, fill: 0x886644, letterSpacing: 3 }),
    });
    wonLabel.anchor.set(0.5);
    wonLabel.y = -H / 2 + 85;
    this.contentLayer.addChild(wonLabel);

    const wonAmount = new Text({
      text: `$${pack.totalPayout.toFixed(2)}`,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 32,
        fill: headerColor,
        fontWeight: 'bold',
        dropShadow: { color: headerColor, blur: 10, distance: 0, angle: 0 },
      }),
    });
    wonAmount.anchor.set(0.5);
    wonAmount.y = -H / 2 + 108;
    this.contentLayer.addChild(wonAmount);

    this.animateCountUp(wonAmount, pack.totalPayout, headerColor);

    // ── Card breakdown ──────────────────────────────────────────────────────
    const cardStartY = -H / 2 + 160;

    sortedCards.forEach((card, i) => {
      const cfg = RARITY_CONFIG[card.rarity];
      const tex = artTextures[i];

      const row = new Container();
      row.y = cardStartY + i * ROW_SPACE;

      // Row bg
      const rowBg = new Graphics();
      rowBg.roundRect(-W / 2 + 16, -ROW_H / 2, W - 32, ROW_H, 6)
        .fill({ color: 0x150b00, alpha: 0.8 });
      rowBg.roundRect(-W / 2 + 16, -ROW_H / 2, W - 32, ROW_H, 6)
        .stroke({ color: cfg.frameColor, width: 1 });
      row.addChild(rowBg);

      // ── Thumbnail: card art or fallback letter ────────────────────────────
      const THUMB_W = 28;
      const THUMB_H = ROW_H - 4;   // 28 px tall
      const THUMB_X = -W / 2 + 22;
      const THUMB_Y = -THUMB_H / 2;

      // Border / background for thumbnail
      const iconBg = new Graphics();
      iconBg.roundRect(THUMB_X, THUMB_Y, THUMB_W, THUMB_H, 3)
        .fill(cfg.frameColor);
      iconBg.roundRect(THUMB_X, THUMB_Y, THUMB_W, THUMB_H, 3)
        .stroke({ color: cfg.glowColor, width: 1 });
      row.addChild(iconBg);

      if (tex) {
        const sprite = new Sprite(tex);
        sprite.x = THUMB_X;
        sprite.y = THUMB_Y;
        sprite.width  = THUMB_W;
        sprite.height = THUMB_H;

        const mask = new Graphics();
        mask.roundRect(THUMB_X, THUMB_Y, THUMB_W, THUMB_H, 3).fill(0xffffff);
        row.addChild(mask);
        row.addChild(sprite);
        sprite.mask = mask;
      } else {
        // Fallback: single initial letter
        const letter = ['C','U','R','E','L'][
          ['common','uncommon','rare','epic','legendary'].indexOf(card.rarity)
        ];
        const mark = new Text({
          text: letter,
          style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fill: 0xffffff, fontWeight: 'bold' }),
        });
        mark.anchor.set(0.5);
        mark.x = THUMB_X + THUMB_W / 2;
        mark.y = 0;
        row.addChild(mark);
      }

      // Card name
      const nameText = new Text({
        text: card.name,
        style: new TextStyle({
          fontFamily: 'Georgia, serif',
          fontSize: 12,
          fill: cfg.labelColor,
          fontWeight: 'bold',
        }),
      });
      nameText.x = -W / 2 + 58;
      nameText.y = -10;
      row.addChild(nameText);

      const rarityText = new Text({
        text: card.rarity.toUpperCase(),
        style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 8, fill: cfg.labelColor, letterSpacing: 1 }),
      });
      rarityText.x = -W / 2 + 58;
      rarityText.y = 4;
      row.addChild(rarityText);

      // Payout (right-aligned)
      const payText = new Text({
        text: `$${card.payout.toFixed(2)}`,
        style: new TextStyle({
          fontFamily: 'Georgia, serif',
          fontSize: 16,
          fill: 0xffdd88,
          fontWeight: 'bold',
          align: 'right',
        }),
      });
      payText.anchor.set(1, 0.5);
      payText.x = W / 2 - 20;
      payText.y = 0;
      row.addChild(payText);

      this.contentLayer.addChild(row);
    });

    // ── Balance box — smaller, just above "open another" ────────────────────
    // playAgainBtn center: H/2 - 80 = 230
    // balance box bottom: 230 - 20 (btn half) - 5 (gap) = 205
    // balance box height: 32, so top = 173
    const balBg = new Graphics();
    balBg.roundRect(-85, H / 2 - 137, 170, 32, 8)
      .fill({ color: 0x1a0d00, alpha: 0.9 });
    balBg.roundRect(-85, H / 2 - 137, 170, 32, 8)
      .stroke({ color: 0x664400, width: 1 });
    this.contentLayer.addChild(balBg);

    const balText = new Text({
      text: `Balance: $${this.economy.balance.toFixed(2)}`,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 13, fill: 0xffdd88, align: 'center' }),
    });
    balText.anchor.set(0.5);
    balText.y = H / 2 - 121;   // center of balance box
    this.contentLayer.addChild(balText);

    // ── Buttons ─────────────────────────────────────────────────────────────
    const playAgainBtn = this.buildButton(
      this.economy.canAffordPack() ? `OPEN ANOTHER  $${PACK_PRICE.toFixed(2)}` : 'DEPOSIT TO PLAY',
      this.economy.canAffordPack() ? 0xffcc00 : 0x226633,
      this.economy.canAffordPack() ? 0x1a0d00 : 0xffffff,
      () => {
        if (this.economy.canAffordPack()) {
          EventBus.emit('pack:buy', undefined);
        } else {
          this.economy.deposit(50);
          EventBus.emit('screen:lobby', undefined);
        }
      },
    );
    playAgainBtn.y = H / 2 - 80;
    this.contentLayer.addChild(playAgainBtn);

    const lobbyBtn = this.buildButton('BACK TO LOBBY', 0x332200, 0x886644, () => {
      EventBus.emit('screen:lobby', undefined);
    });
    lobbyBtn.y = H / 2 - 35;
    this.contentLayer.addChild(lobbyBtn);

    // Celebration particles for wins
    if (winRatio >= 1) {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const x = (Math.random() - 0.5) * 300;
          const y = (Math.random() - 0.5) * 200;
          this.particles.burst(x, y, 20, 0xffcc00, 0.8, 1.2);
        }, i * 150);
      }
    }

    if (winRatio >= 2) AudioManager.play('win_fanfare');
  }

  private animateCountUp(label: Text, target: number, _color: number): void {
    let current = 0;
    const duration = 0.8;
    const step = target / (duration * 60);

    const tick = () => {
      current = Math.min(current + step, target);
      label.text = `$${current.toFixed(2)}`;
      if (current < target) requestAnimationFrame(tick);
      else {
        label.text = `$${target.toFixed(2)}`;
        label.scale.set(1.15);
        setTimeout(() => label.scale.set(1), 120);
      }
    };
    requestAnimationFrame(tick);
  }

  private buildButton(label: string, bgColor: number, textColor: number, onClick: () => void): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(-140, -20, 280, 40, 10).fill(bgColor);
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        fill: textColor,
        fontWeight: 'bold',
        letterSpacing: 2,
        align: 'center',
      }),
    });
    txt.anchor.set(0.5);
    btn.addChild(txt);

    btn.on('pointerdown', () => { btn.scale.set(0.95); onClick(); });
    btn.on('pointerup',       () => btn.scale.set(1));
    btn.on('pointerupoutside',() => btn.scale.set(1));
    btn.on('pointerover', () => { bg.tint = 0xdddddd; });
    btn.on('pointerout',  () => { bg.tint = 0xffffff; });

    return btn;
  }

  update(dt: number): void {
    this.particles.update(dt);
  }

  show(): void  { this.container.visible = true; }
  hide(): void  { this.container.visible = false; }

  destroy(): void {
    this.particles.destroy();
    this.container.destroy({ children: true });
  }
}
