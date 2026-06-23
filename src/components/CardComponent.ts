import { Container, Graphics, Text, TextStyle, BlurFilter } from 'pixi.js';
import type { CardDef, Rarity } from '../game/cards/CardDefinitions';
import { RARITY_CONFIG } from '../game/cards/CardDefinitions';

const CARD_W = 130;
const CARD_H = 190;

export { CARD_W, CARD_H };

// Draws the card back (face down)
function drawBack(gfx: Graphics): void {
  // Shadow
  gfx.roundRect(-CARD_W / 2 + 2, -CARD_H / 2 + 4, CARD_W, CARD_H, 12).fill({ color: 0x000000, alpha: 0.4 });
  // Main body
  gfx.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 12).fill(0x1a0d00);
  // Gold border
  gfx.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 12).stroke({ color: 0xaa7700, width: 2 });
  // Inner border
  gfx.roundRect(-CARD_W / 2 + 8, -CARD_H / 2 + 8, CARD_W - 16, CARD_H - 16, 8).stroke({ color: 0x664400, width: 1 });

  // Eye of Ra symbol as simple geometry
  const cx = 0, cy = -10;
  gfx.ellipse(cx, cy, 28, 18).stroke({ color: 0xcc9900, width: 2 });
  gfx.circle(cx, cy, 9).fill(0xcc9900);
  gfx.circle(cx, cy, 5).fill(0x1a0d00);

  // Decorative lines
  for (let i = 0; i < 3; i++) {
    const y = 40 + i * 14;
    gfx.rect(-24, y, 48, 2).fill({ color: 0x664400, alpha: 0.6 });
  }

  // "?" text
  gfx.rect(-10, -CARD_H / 2 + 14, 20, 20).fill({ color: 0x000000, alpha: 0 }); // spacer
}

// Draws the card front with rarity-specific art
function drawFront(gfx: Graphics, card: CardDef): void {
  const cfg = RARITY_CONFIG[card.rarity];

  // Shadow
  gfx.roundRect(-CARD_W / 2 + 3, -CARD_H / 2 + 5, CARD_W, CARD_H, 12).fill({ color: 0x000000, alpha: 0.5 });
  // Main body gradient-ish (two fills)
  gfx.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 12).fill(0x0d0700);
  gfx.roundRect(-CARD_W / 2, CARD_H / 2 - 60, CARD_W, 60, 12).fill({ color: 0x1a0e00, alpha: 0.9 });

  // Rarity frame
  gfx.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 12).stroke({ color: cfg.frameColor, width: 3 });
  // Inner glow border
  gfx.roundRect(-CARD_W / 2 + 5, -CARD_H / 2 + 5, CARD_W - 10, CARD_H - 10, 9)
    .stroke({ color: cfg.glowColor, width: 1, alpha: 0.5 });

  // Artwork area background
  const artY = -CARD_H / 2 + 16;
  const artH = 100;
  gfx.roundRect(-CARD_W / 2 + 10, artY, CARD_W - 20, artH, 6).fill(0x150b00);
  gfx.roundRect(-CARD_W / 2 + 10, artY, CARD_W - 20, artH, 6).stroke({ color: cfg.frameColor, width: 1 });

  // Procedural artwork based on rarity/ID
  drawArtwork(gfx, card, artY + artH / 2, artH);

  // Rarity badge
  const badgeY = artY + artH + 8;
  gfx.roundRect(-30, badgeY, 60, 14, 4).fill(cfg.frameColor);
}

function drawArtwork(gfx: Graphics, card: CardDef, centerY: number, artH: number): void {
  const colors: Record<Rarity, number[]> = {
    common:    [0x996633, 0x664422, 0xaa8844],
    uncommon:  [0x33aa55, 0x226633, 0x55cc77],
    rare:      [0x3366cc, 0x224488, 0x4499ff],
    epic:      [0x8833cc, 0x552299, 0xaa44ff],
    legendary: [0xffaa00, 0xcc7700, 0xffdd44],
  };
  const [c1, c2, c3] = colors[card.rarity];

  const hw = CARD_W / 2 - 12;

  // Background gradient strip
  gfx.rect(-hw, centerY - artH / 2, hw * 2, artH / 3).fill({ color: c2, alpha: 0.4 });

  // Central symbol — varies by rarity
  switch (card.rarity) {
    case 'common': {
      // Simple scarab/coin
      gfx.circle(0, centerY, 20).fill(c2);
      gfx.circle(0, centerY, 20).stroke({ color: c1, width: 2 });
      gfx.circle(0, centerY, 8).fill(c1);
      break;
    }
    case 'uncommon': {
      // Eye of Horus
      gfx.ellipse(0, centerY, 26, 16).stroke({ color: c1, width: 2 });
      gfx.circle(0, centerY, 8).fill(c1);
      gfx.circle(0, centerY, 4).fill(c2);
      // Lower lines
      gfx.moveTo(-4, centerY + 9).lineTo(-10, centerY + 18).stroke({ color: c1, width: 1.5 });
      gfx.moveTo(4, centerY + 9).lineTo(8, centerY + 22).stroke({ color: c1, width: 1.5 });
      break;
    }
    case 'rare': {
      // Ankh
      gfx.circle(0, centerY - 16, 12).stroke({ color: c1, width: 2.5 });
      gfx.rect(-2, centerY - 4, 4, 28).fill(c1);
      gfx.rect(-14, centerY + 4, 28, 4).fill(c1);
      break;
    }
    case 'epic': {
      // Pyramid
      const py = centerY + 20;
      gfx.moveTo(0, py - 44).lineTo(32, py).lineTo(-32, py).lineTo(0, py - 44).fill({ color: c2, alpha: 0.6 });
      gfx.moveTo(0, py - 44).lineTo(32, py).lineTo(-32, py).lineTo(0, py - 44).stroke({ color: c1, width: 2 });
      // Eye inside
      gfx.circle(0, py - 22, 7).fill(c3);
      gfx.circle(0, py - 22, 3).fill(0x000000);
      break;
    }
    case 'legendary': {
      // Radiant sun with rays
      gfx.circle(0, centerY, 18).fill(c3);
      gfx.circle(0, centerY, 18).stroke({ color: c1, width: 2 });
      // Rays
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        const x1 = Math.cos(a) * 22;
        const y1 = Math.sin(a) * 22;
        const x2 = Math.cos(a) * 34;
        const y2 = Math.sin(a) * 34;
        gfx.moveTo(x1, centerY + y1).lineTo(x2, centerY + y2).stroke({ color: c1, width: 2 });
      }
      gfx.circle(0, centerY, 10).fill(c1);
      break;
    }
  }

  // Corner hieroglyphics (decorative squiggles)
  gfx.rect(-hw, centerY - artH / 2, 8, 2).fill({ color: c3, alpha: 0.5 });
  gfx.rect(-hw, centerY - artH / 2 + 4, 8, 2).fill({ color: c3, alpha: 0.5 });
  gfx.rect(hw - 8, centerY - artH / 2, 8, 2).fill({ color: c3, alpha: 0.5 });
}

// Glow ring behind legendary/epic cards
function createGlowRing(color: number, alpha = 0.3): Graphics {
  const g = new Graphics();
  g.circle(0, 0, CARD_W * 0.7).fill({ color, alpha });
  const blur = new BlurFilter({ strength: 24 });
  g.filters = [blur];
  return g;
}

export class CardComponent {
  readonly container: Container;
  private backGfx: Graphics;
  private frontGfx!: Graphics;
  private nameLabel!: Text;
  private payoutLabel!: Text;
  private rarityLabel!: Text;
  private glowRing?: Graphics;

  private _flipped = false;
  private _card: CardDef | null = null;

  constructor() {
    this.container = new Container();
    this.backGfx = new Graphics();
    drawBack(this.backGfx);
    this.container.addChild(this.backGfx);
  }

  get card(): CardDef | null { return this._card; }
  get flipped(): boolean { return this._flipped; }

  assignCard(card: CardDef): void {
    this._card = card;
  }

  /** Switches the visual from back → front. Call at mid-flip when scaleX ≈ 0. */
  revealFront(): void {
    if (!this._card || this._flipped) return;
    this._flipped = true;
    const card = this._card;
    const cfg = RARITY_CONFIG[card.rarity];

    // Remove back
    this.container.removeChild(this.backGfx);
    this.backGfx.destroy();

    // Glow ring for epic/legendary
    if (card.rarity === 'epic' || card.rarity === 'legendary') {
      this.glowRing = createGlowRing(cfg.glowColor);
      this.container.addChildAt(this.glowRing, 0);
    }

    // Front graphic
    this.frontGfx = new Graphics();
    drawFront(this.frontGfx, card);
    this.container.addChild(this.frontGfx);

    // Name label
    this.nameLabel = new Text({
      text: card.name,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 11,
        fill: cfg.labelColor,
        fontWeight: 'bold',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: CARD_W - 24,
      }),
    });
    this.nameLabel.anchor.set(0.5);
    this.nameLabel.y = CARD_H / 2 - 42;
    this.container.addChild(this.nameLabel);

    // Rarity label
    this.rarityLabel = new Text({
      text: card.rarity.toUpperCase(),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 8,
        fill: cfg.labelColor,
        letterSpacing: 2,
        align: 'center',
      }),
    });
    this.rarityLabel.anchor.set(0.5);
    this.rarityLabel.y = CARD_H / 2 - 28;
    this.container.addChild(this.rarityLabel);

    // Payout label
    this.payoutLabel = new Text({
      text: `$${card.payout.toFixed(2)}`,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 16,
        fill: 0xffdd88,
        fontWeight: 'bold',
        align: 'center',
        dropShadow: { color: 0x000000, blur: 4, distance: 2, angle: Math.PI / 4 },
      }),
    });
    this.payoutLabel.anchor.set(0.5);
    this.payoutLabel.y = CARD_H / 2 - 12;
    this.payoutLabel.alpha = 0;
    this.container.addChild(this.payoutLabel);
  }

  showPayout(): void {
    if (this.payoutLabel) this.payoutLabel.alpha = 1;
  }

  /** Animate the payout label popping up */
  animatePayout(onDone?: () => void): void {
    if (!this.payoutLabel) { onDone?.(); return; }
    this.payoutLabel.alpha = 0;
    this.payoutLabel.scale.set(2);
    this.payoutLabel.visible = true;

    let t = 0;
    const tick = () => {
      t += 1 / 30;
      const progress = Math.min(t, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.payoutLabel.alpha = eased;
      this.payoutLabel.scale.set(2 - eased);
      if (progress < 1) requestAnimationFrame(tick);
      else onDone?.();
    };
    requestAnimationFrame(tick);
  }

  animateGlowPulse(): void {
    if (!this.glowRing) return;
    let t = 0;
    const pulse = () => {
      t += 0.05;
      if (this.glowRing) this.glowRing.alpha = 0.2 + 0.15 * Math.sin(t * 3);
      if (this._flipped) requestAnimationFrame(pulse);
    };
    requestAnimationFrame(pulse);
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
