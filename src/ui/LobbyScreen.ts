import { Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import { EventBus } from '../managers/EventBus';
import { type EconomyManager } from '../game/economy/EconomyManager';
import { PACK_PRICE } from '../game/math/RTPModel';
import { computeRTPReport } from '../game/math/RTPModel';
import { AssetLoader } from '../managers/AssetLoader';

const W = 420;
const H = 700;
const HEADER_H = 80;

// Stats panel sits OUTSIDE the main rectangle, to the right
const STATS_X = W / 2 + 15;   // 225 — starts past the right border
const STATS_W = 180;
const STATS_Y = -H / 2 + HEADER_H + 10;  // -260
const STATS_H = 310;

// Pack is centered in the main panel; doubled vertically spans ±170
const PACK_CX = 0;
const PACK_CY = -80;

export class LobbyScreen {
  readonly container: Container;
  private balanceLabel!: Text;
  private buyBtn!: Container;
  private statsLabel!: Text;
  private economy: EconomyManager;
  private packArtLayer!: Container;

  constructor(economy: EconomyManager) {
    this.economy = economy;
    this.container = new Container();
    this.build();
    EventBus.on('balance:changed', (bal) => this.updateBalance(bal));
  }

  private build(): void {
    // ── Background ──────────────────────────────────────────
    const bg = new Graphics();
    bg.roundRect(-W / 2, -H / 2, W, H, 20).fill({ color: 0x000033 });
    bg.roundRect(-W / 2, -H / 2, W, H, 20).stroke({ color: 0x886600, width: 2 });
    this.container.addChild(bg);

    // ── Header ──────────────────────────────────────────────
    const headerBg = new Graphics();
    headerBg.rect(-W / 2, -H / 2, W, HEADER_H).fill({ color: 0x00001a, alpha: 0.9 });
    headerBg.moveTo(-W / 2, -H / 2 + HEADER_H).lineTo(W / 2, -H / 2 + HEADER_H)
      .stroke({ color: 0x886600, width: 1 });
    this.container.addChild(headerBg);

    const title = new Text({
      text: "PHARAOH'S PACK",
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 24,
        fill: 0xffcc00,
        fontWeight: 'bold',
        letterSpacing: 4,
        dropShadow: { color: 0xff8800, blur: 12, distance: 0, angle: 0 },
      }),
    });
    title.anchor.set(0.5);
    title.x = -35;
    title.y = -H / 2 + 28;
    this.container.addChild(title);

    const subtitle = new Text({
      text: 'Ancient Egypt Card Reveals',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 11, fill: 0xaa7700, letterSpacing: 2 }),
    });
    subtitle.anchor.set(0.5);
    subtitle.x = -35;
    subtitle.y = -H / 2 + 56;
    this.container.addChild(subtitle);

    // ── Deposit button — small, top-right ───────────────────
    const depositBtn = this.buildSmallButton('+$50', 0x1a5c33, 0xffffff, () => {
      this.economy.deposit(50);
    });
    depositBtn.x = W / 2 - 52;
    depositBtn.y = -H / 2 + 38;
    this.container.addChild(depositBtn);

    // ── Pack art — doubled size, centered ───────────────────
    this.buildPackArt();

    // ── Stats panel — outside the main rectangle ─────────────
    this.buildStatsPanel();

    // ── Separator ───────────────────────────────────────────
    const sep = new Graphics();
    sep.rect(-W / 2 + 20, 130, W - 40, 1).fill({ color: 0x886600, alpha: 0.4 });
    this.container.addChild(sep);

    // ── Balance ─────────────────────────────────────────────
    const balTitle = new Text({
      text: 'BALANCE',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 9, fill: 0x886644, letterSpacing: 3 }),
    });
    balTitle.anchor.set(0.5);
    balTitle.y = 148;
    this.container.addChild(balTitle);

    const balBg = new Graphics();
    balBg.roundRect(-110, 158, 220, 44, 10).fill({ color: 0x00001a, alpha: 0.9 });
    balBg.roundRect(-110, 158, 220, 44, 10).stroke({ color: 0x664400, width: 1 });
    this.container.addChild(balBg);

    this.balanceLabel = new Text({
      text: `$${this.economy.balance.toFixed(2)}`,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 28,
        fill: 0xffdd88,
        fontWeight: 'bold',
        dropShadow: { color: 0xff8800, blur: 8, distance: 0, angle: 0 },
      }),
    });
    this.balanceLabel.anchor.set(0.5);
    this.balanceLabel.y = 180;
    this.container.addChild(this.balanceLabel);

    // ── Pack price info ──────────────────────────────────────
    const priceText = new Text({
      text: `Pack Price: $${PACK_PRICE.toFixed(2)}  •  5 Cards`,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 12, fill: 0x886644 }),
    });
    priceText.anchor.set(0.5);
    priceText.y = 222;
    this.container.addChild(priceText);

    // ── Buy button ───────────────────────────────────────────
    this.buyBtn = this.buildButton(
      `OPEN PACK  $${PACK_PRICE.toFixed(2)}`,
      0xffcc00,
      0x1a0d00,
      () => {
        if (this.economy.canAffordPack()) EventBus.emit('pack:buy', undefined);
      },
    );
    this.buyBtn.y = 265;
    this.container.addChild(this.buyBtn);

    // ── Footer ───────────────────────────────────────────────
    const ornament = new Graphics();
    ornament.rect(-80, H / 2 - 35, 160, 1).fill({ color: 0x886600, alpha: 0.5 });
    this.container.addChild(ornament);

    const footer = new Text({
      text: '18+ • Play Responsibly • Demo Mode',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 9, fill: 0x443322, align: 'center' }),
    });
    footer.anchor.set(0.5);
    footer.y = H / 2 - 20;
    this.container.addChild(footer);
  }

  private buildPackArt(): void {
    this.packArtLayer = new Container();
    this.packArtLayer.x = PACK_CX;
    this.packArtLayer.y = PACK_CY;
    this.container.addChild(this.packArtLayer);

    this.drawProceduralPack();

    const packLabel = new Text({
      text: 'ANCIENT PACK',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 11, fill: 0xcc9900, letterSpacing: 2 }),
    });
    packLabel.anchor.set(0.5);
    packLabel.y = PACK_CY + 190;
    this.container.addChild(packLabel);

    AssetLoader.loadPackImage().then(tex => {
      if (!tex) return;
      this.packArtLayer.removeChildren();
      const sprite = new Sprite(tex);
      sprite.anchor.set(0.5);
      const scale = Math.min(240 / tex.width, 360 / tex.height);
      sprite.scale.set(scale);
      this.packArtLayer.addChild(sprite);
    });
  }

  private buildStatsPanel(): void {
    const sx = STATS_X;
    const sy = STATS_Y;
    const sw = STATS_W;
    const sh = STATS_H;
    const cx = sx + sw / 2;

    // Brown panel — outside the main rectangle
    const statsBg = new Graphics();
    statsBg.roundRect(sx, sy, sw, sh, 10).fill({ color: 0x3d1500 });
    statsBg.roundRect(sx, sy, sw, sh, 10).stroke({ color: 0x886600, width: 1 });
    this.container.addChild(statsBg);

    const statsTitle = new Text({
      text: 'SESSION STATS',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 11,
        fill: 0xffcc00,
        fontWeight: 'bold',
        letterSpacing: 2,
      }),
    });
    statsTitle.anchor.set(0.5);
    statsTitle.x = cx;
    statsTitle.y = sy + 20;
    this.container.addChild(statsTitle);

    const div1 = new Graphics();
    div1.rect(sx + 10, sy + 34, sw - 20, 1).fill({ color: 0x886600, alpha: 0.6 });
    this.container.addChild(div1);

    const report = computeRTPReport();
    const rtpInfoText = new Text({
      text: `Theoretical RTP\n${(report.rtp * 100).toFixed(1)}%  (target 95%)`,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 10,
        fill: 0xcc9944,
        align: 'center',
        lineHeight: 17,
      }),
    });
    rtpInfoText.anchor.set(0.5);
    rtpInfoText.x = cx;
    rtpInfoText.y = sy + 62;
    this.container.addChild(rtpInfoText);

    const div2 = new Graphics();
    div2.rect(sx + 10, sy + 90, sw - 20, 1).fill({ color: 0x664433, alpha: 0.4 });
    this.container.addChild(div2);

    this.statsLabel = new Text({
      text: this.buildStatsText(),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 11,
        fill: 0xaa8855,
        align: 'center',
        lineHeight: 22,
      }),
    });
    this.statsLabel.anchor.set(0.5);
    this.statsLabel.x = cx;
    this.statsLabel.y = sy + 185;
    this.container.addChild(this.statsLabel);
  }

  private drawProceduralPack(): void {
    const g = new Graphics();
    // Doubled from 110×170 → 220×340
    g.roundRect(-110, -170, 220, 340, 16).fill(0x00001a);
    g.roundRect(-110, -170, 220, 340, 16).stroke({ color: 0xcc9900, width: 5 });
    g.roundRect(-94, -152, 188, 304, 10).stroke({ color: 0x664400, width: 2 });

    g.circle(0, -20, 60).fill({ color: 0xcc9900, alpha: 0.15 });
    g.circle(0, -20, 60).stroke({ color: 0xcc9900, width: 3 });
    g.moveTo(0, -72).lineTo(52, 32).lineTo(-52, 32).lineTo(0, -72).fill({ color: 0xcc9900, alpha: 0.8 });

    for (let i = 0; i < 5; i++) {
      g.circle(-64 + i * 32, 126, 8).fill(0xcc9900);
    }

    this.packArtLayer.addChild(g);
  }

  private buildButton(label: string, bgColor: number, textColor: number, onClick: () => void): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(-130, -22, 260, 44, 10).fill(bgColor);
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 14,
        fill: textColor,
        fontWeight: 'bold',
        letterSpacing: 2,
      }),
    });
    txt.anchor.set(0.5);
    btn.addChild(txt);

    btn.on('pointerdown', () => { btn.scale.set(0.95); onClick(); });
    btn.on('pointerup', () => btn.scale.set(1));
    btn.on('pointerupoutside', () => btn.scale.set(1));
    btn.on('pointerover', () => { bg.tint = 0xdddddd; });
    btn.on('pointerout', () => { bg.tint = 0xffffff; });

    return btn;
  }

  private buildSmallButton(label: string, bgColor: number, textColor: number, onClick: () => void): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(-38, -14, 76, 28, 7).fill(bgColor);
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 11,
        fill: textColor,
        fontWeight: 'bold',
        letterSpacing: 1,
      }),
    });
    txt.anchor.set(0.5);
    btn.addChild(txt);

    btn.on('pointerdown', () => { btn.scale.set(0.95); onClick(); });
    btn.on('pointerup', () => btn.scale.set(1));
    btn.on('pointerupoutside', () => btn.scale.set(1));
    btn.on('pointerover', () => { bg.tint = 0xdddddd; });
    btn.on('pointerout', () => { bg.tint = 0xffffff; });

    return btn;
  }

  private buildStatsText(): string {
    const s = this.economy.sessionStats;
    const rtp = s.totalWagered > 0 ? (s.sessionRTP * 100).toFixed(1) + '%' : 'N/A';
    return [
      `Packs: ${s.packsOpened}`,
      `Wagered: $${s.totalWagered.toFixed(2)}`,
      `Won: $${s.totalWon.toFixed(2)}`,
      `Session RTP: ${rtp}`,
    ].join('\n');
  }

  updateBalance(balance: number): void {
    this.balanceLabel.text = `$${balance.toFixed(2)}`;
    this.statsLabel.text = this.buildStatsText();
    this.buyBtn.alpha = this.economy.canAffordPack() ? 1.0 : 0.4;
  }

  show(): void { this.container.visible = true; }
  hide(): void { this.container.visible = false; }

  destroy(): void { this.container.destroy({ children: true }); }
}
