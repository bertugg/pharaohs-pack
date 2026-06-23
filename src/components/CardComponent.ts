import { Container, Graphics, Sprite, Text, TextStyle, BlurFilter, Texture } from 'pixi.js';
import type { CardDef, Rarity } from '../game/cards/CardDefinitions';
import { RARITY_CONFIG } from '../game/cards/CardDefinitions';

const CARD_W = 280;
const CARD_H = 360;

export { CARD_W, CARD_H };

// Artwork area: 256×256, centered horizontally with 12 px padding each side
const ART_X = -CARD_W / 2 + 12;  // -128
const ART_Y = -CARD_H / 2 + 16;  // -164
const ART_W = 256;
const ART_H = 256;

function drawBack(gfx: Graphics): void {
  // Shadow
  gfx.roundRect(-CARD_W / 2 + 3, -CARD_H / 2 + 5, CARD_W, CARD_H, 18).fill({ color: 0x000000, alpha: 0.4 });
  // Main body
  gfx.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18).fill(0x1a0d00);
  // Gold border
  gfx.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18).stroke({ color: 0xaa7700, width: 3 });
  // Inner border
  gfx.roundRect(-CARD_W / 2 + 12, -CARD_H / 2 + 12, CARD_W - 24, CARD_H - 24, 12).stroke({ color: 0x664400, width: 1.5 });

  // Eye of Ra symbol — scaled up from the 130×190 version
  const cx = 0, cy = -20;
  gfx.ellipse(cx, cy, 58, 38).stroke({ color: 0xcc9900, width: 3 });
  gfx.circle(cx, cy, 20).fill(0xcc9900);
  gfx.circle(cx, cy, 11).fill(0x1a0d00);

  // Decorative bars
  for (let i = 0; i < 3; i++) {
    const y = 80 + i * 28;
    gfx.rect(-52, y, 104, 4).fill({ color: 0x664400, alpha: 0.6 });
  }
}

// When includeArtwork is false the artwork area background is still drawn but
// the procedural symbol is skipped — caller layers a Sprite on top instead.
function drawFront(gfx: Graphics, card: CardDef, includeArtwork: boolean): void {
  const cfg = RARITY_CONFIG[card.rarity];

  // Shadow
  gfx.roundRect(-CARD_W / 2 + 4, -CARD_H / 2 + 6, CARD_W, CARD_H, 18).fill({ color: 0x000000, alpha: 0.5 });
  // Main body
  gfx.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18).fill(0x0d0700);
  gfx.roundRect(-CARD_W / 2, CARD_H / 2 - 100, CARD_W, 100, 18).fill({ color: 0x1a0e00, alpha: 0.9 });

  // Rarity frame
  gfx.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18).stroke({ color: cfg.frameColor, width: 4 });
  gfx.roundRect(-CARD_W / 2 + 8, -CARD_H / 2 + 8, CARD_W - 16, CARD_H - 16, 13)
    .stroke({ color: cfg.glowColor, width: 1.5, alpha: 0.5 });

  // Artwork area background + border
  gfx.roundRect(ART_X, ART_Y, ART_W, ART_H, 8).fill(0x150b00);
  gfx.roundRect(ART_X, ART_Y, ART_W, ART_H, 8).stroke({ color: cfg.frameColor, width: 1.5 });

  if (includeArtwork) drawArtwork(gfx, card, ART_Y + ART_H / 2, ART_H);
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
  const hw = CARD_W / 2 - 14;  // 126

  // Background gradient strip
  gfx.rect(-hw, centerY - artH / 2, hw * 2, artH / 3).fill({ color: c2, alpha: 0.4 });

  switch (card.rarity) {
    case 'common': {
      gfx.circle(0, centerY, 46).fill(c2);
      gfx.circle(0, centerY, 46).stroke({ color: c1, width: 4 });
      gfx.circle(0, centerY, 19).fill(c1);
      break;
    }
    case 'uncommon': {
      gfx.ellipse(0, centerY, 60, 37).stroke({ color: c1, width: 4 });
      gfx.circle(0, centerY, 19).fill(c1);
      gfx.circle(0, centerY, 9).fill(c2);
      gfx.moveTo(-9, centerY + 21).lineTo(-23, centerY + 42).stroke({ color: c1, width: 3 });
      gfx.moveTo(9, centerY + 21).lineTo(19, centerY + 51).stroke({ color: c1, width: 3 });
      break;
    }
    case 'rare': {
      gfx.circle(0, centerY - 37, 28).stroke({ color: c1, width: 5 });
      gfx.rect(-5, centerY - 9, 10, 65).fill(c1);
      gfx.rect(-33, centerY + 9, 66, 10).fill(c1);
      break;
    }
    case 'epic': {
      const py = centerY + 47;
      gfx.moveTo(0, py - 102).lineTo(75, py).lineTo(-75, py).lineTo(0, py - 102).fill({ color: c2, alpha: 0.6 });
      gfx.moveTo(0, py - 102).lineTo(75, py).lineTo(-75, py).lineTo(0, py - 102).stroke({ color: c1, width: 4 });
      gfx.circle(0, py - 51, 16).fill(c3);
      gfx.circle(0, py - 51, 7).fill(0x000000);
      break;
    }
    case 'legendary': {
      gfx.circle(0, centerY, 42).fill(c3);
      gfx.circle(0, centerY, 42).stroke({ color: c1, width: 4 });
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        const x1 = Math.cos(a) * 51, y1 = Math.sin(a) * 51;
        const x2 = Math.cos(a) * 79, y2 = Math.sin(a) * 79;
        gfx.moveTo(x1, centerY + y1).lineTo(x2, centerY + y2).stroke({ color: c1, width: 4 });
      }
      gfx.circle(0, centerY, 23).fill(c1);
      break;
    }
  }

  // Corner hieroglyphic marks
  gfx.rect(-hw, centerY - artH / 2, 19, 5).fill({ color: c3, alpha: 0.5 });
  gfx.rect(-hw, centerY - artH / 2 + 9, 19, 5).fill({ color: c3, alpha: 0.5 });
  gfx.rect(hw - 19, centerY - artH / 2, 19, 5).fill({ color: c3, alpha: 0.5 });
}

function createGlowRing(color: number, alpha = 0.3): Graphics {
  const g = new Graphics();
  g.circle(0, 0, CARD_W * 0.7).fill({ color, alpha });
  const blur = new BlurFilter({ strength: 36 });
  g.filters = [blur];
  return g;
}

export class CardComponent {
  readonly container: Container;
  private backGfx: Graphics | null = null;
  private backSprite: Sprite | null = null;
  private frontGfx!: Graphics;
  private nameLabel!: Text;
  private payoutLabel!: Text;
  private rarityLabel!: Text;
  private glowRing?: Graphics;
  private cardTexture: Texture | null = null;

  private _flipped = false;
  private _card: CardDef | null = null;

  constructor(backTexture: Texture | null = null) {
    this.container = new Container();

    if (backTexture) {
      const shadow = new Graphics();
      shadow.roundRect(-CARD_W / 2 + 3, -CARD_H / 2 + 5, CARD_W, CARD_H, 18).fill({ color: 0x000000, alpha: 0.4 });
      this.container.addChild(shadow);

      this.backSprite = new Sprite(backTexture);
      this.backSprite.anchor.set(0.5);
      this.backSprite.width = CARD_W;
      this.backSprite.height = CARD_H;

      // Rounded-rect mask matching the card border radius
      const backMask = new Graphics();
      backMask.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18).fill(0xffffff);
      this.container.addChild(backMask);
      this.container.addChild(this.backSprite);
      this.backSprite.mask = backMask;

      // Gold border drawn on top of the sprite
      const border = new Graphics();
      border.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18).stroke({ color: 0xaa7700, width: 3 });
      border.roundRect(-CARD_W / 2 + 12, -CARD_H / 2 + 12, CARD_W - 24, CARD_H - 24, 12).stroke({ color: 0x664400, width: 1.5 });
      this.container.addChild(border);
    } else {
      this.backGfx = new Graphics();
      drawBack(this.backGfx);
      this.container.addChild(this.backGfx);
    }
  }

  get card(): CardDef | null { return this._card; }
  get flipped(): boolean { return this._flipped; }

  assignCard(card: CardDef): void { this._card = card; }

  setCardTexture(tex: Texture | null): void { this.cardTexture = tex; }

  /** Switches the visual from back → front. Call at mid-flip when scaleX ≈ 0. */
  revealFront(): void {
    if (!this._card || this._flipped) return;
    this._flipped = true;
    const card = this._card;
    const cfg = RARITY_CONFIG[card.rarity];

    // Remove back visual
    if (this.backGfx) {
      this.container.removeChild(this.backGfx);
      this.backGfx.destroy();
      this.backGfx = null;
    }
    if (this.backSprite) {
      this.container.removeChildren(); // removes shadow + sprite together
      this.backSprite = null;
    }

    // Glow ring for epic/legendary
    if (card.rarity === 'epic' || card.rarity === 'legendary') {
      this.glowRing = createGlowRing(cfg.glowColor);
      this.container.addChildAt(this.glowRing, 0);
    }

    // Front graphic
    this.frontGfx = new Graphics();
    drawFront(this.frontGfx, card, this.cardTexture === null);
    this.container.addChild(this.frontGfx);

    // Custom artwork sprite clipped to the artwork area
    if (this.cardTexture) {
      const artSprite = new Sprite(this.cardTexture);
      artSprite.x = ART_X;
      artSprite.y = ART_Y;
      artSprite.width = ART_W;
      artSprite.height = ART_H;

      const artMask = new Graphics();
      artMask.roundRect(ART_X, ART_Y, ART_W, ART_H, 8).fill(0xffffff);
      this.container.addChild(artMask);
      this.container.addChild(artSprite);
      artSprite.mask = artMask;
    }

    // Empty area below artwork: y=92 to y=180 (88px).
    // Group: name(~22px) + 5 gap + rarity(~12px) + 5 gap + payout(~32px) = 76px
    // Vertical padding: (88-76)/2 = 6px → group starts at y=98, ends at y=180.
    this.nameLabel = new Text({
      text: card.name,
      style: new TextStyle({
        fontFamily: '"Josefin Sans", sans-serif',
        fontSize: 17,
        fill: cfg.labelColor,
        fontWeight: '700',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: CARD_W - 32,
        letterSpacing: 1,
        stroke: { color: 0x000000, width: 4 },
      }),
    });
    this.nameLabel.anchor.set(0.5);
    this.nameLabel.y = 109;   // center of name block
    this.container.addChild(this.nameLabel);

    this.rarityLabel = new Text({
      text: card.rarity.toUpperCase(),
      style: new TextStyle({
        fontFamily: '"Josefin Sans", sans-serif',
        fontSize: 9,
        fill: cfg.labelColor,
        fontWeight: '600',
        letterSpacing: 4,
        align: 'center',
        stroke: { color: 0x000000, width: 2 },
      }),
    });
    this.rarityLabel.anchor.set(0.5);
    this.rarityLabel.y = 131;  // center of rarity block
    this.container.addChild(this.rarityLabel);

    this.payoutLabel = new Text({
      text: `$${card.payout.toFixed(2)}`,
      style: new TextStyle({
        fontFamily: '"Josefin Sans", sans-serif',
        fontSize: 26,
        fill: 0xffdd88,
        fontWeight: '700',
        align: 'center',
        stroke: { color: 0x000000, width: 5 },
      }),
    });
    this.payoutLabel.anchor.set(0.5);
    this.payoutLabel.y = 153;
    this.payoutLabel.alpha = 0;
    this.container.addChild(this.payoutLabel);
  }

  showPayout(): void {
    if (this.payoutLabel) this.payoutLabel.alpha = 1;
  }

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
