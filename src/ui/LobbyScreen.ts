import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { EventBus } from '../managers/EventBus';
import { type EconomyManager } from '../game/economy/EconomyManager';
import { PACK_PRICE } from '../game/math/RTPModel';
import { computeRTPReport } from '../game/math/RTPModel';

const W = 420;
const H = 700;

export class LobbyScreen {
  readonly container: Container;
  private balanceLabel!: Text;
  private buyBtn!: Container;
  private statsLabel!: Text;
  private economy: EconomyManager;

  constructor(economy: EconomyManager) {
    this.economy = economy;
    this.container = new Container();
    this.build();
    EventBus.on('balance:changed', (bal) => this.updateBalance(bal));
  }

  private build(): void {
    // Background panel
    const bg = new Graphics();
    bg.roundRect(-W / 2, -H / 2, W, H, 20).fill({ color: 0x0d0700, alpha: 0.95 });
    bg.roundRect(-W / 2, -H / 2, W, H, 20).stroke({ color: 0x886600, width: 2 });
    this.container.addChild(bg);

    // Header decoration
    const header = new Graphics();
    header.rect(-W / 2, -H / 2, W, 80).fill({ color: 0x1a0d00, alpha: 0.8 });
    header.moveTo(-W / 2, -H / 2 + 80).lineTo(W / 2, -H / 2 + 80).stroke({ color: 0x886600, width: 1 });
    this.container.addChild(header);

    // Title
    const title = new Text({
      text: "PHARAOH'S PACK",
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 28,
        fill: 0xffcc00,
        fontWeight: 'bold',
        letterSpacing: 4,
        dropShadow: { color: 0xff8800, blur: 12, distance: 0, angle: 0 },
      }),
    });
    title.anchor.set(0.5);
    title.y = -H / 2 + 38;
    this.container.addChild(title);

    const subtitle = new Text({
      text: 'Ancient Egypt Card Reveals',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 12, fill: 0xaa7700, letterSpacing: 2 }),
    });
    subtitle.anchor.set(0.5);
    subtitle.y = -H / 2 + 62;
    this.container.addChild(subtitle);

    // Pack art area
    this.buildPackArt();

    // Balance section
    const balBg = new Graphics();
    balBg.roundRect(-120, -20, 240, 50, 10).fill({ color: 0x1a0d00, alpha: 0.8 });
    balBg.roundRect(-120, -20, 240, 50, 10).stroke({ color: 0x664400, width: 1 });
    balBg.y = -H / 2 + 280;
    this.container.addChild(balBg);

    const balTitle = new Text({
      text: 'BALANCE',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 10, fill: 0x886644, letterSpacing: 3 }),
    });
    balTitle.anchor.set(0.5);
    balTitle.y = -H / 2 + 270;
    this.container.addChild(balTitle);

    this.balanceLabel = new Text({
      text: `$${this.economy.balance.toFixed(2)}`,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 32,
        fill: 0xffdd88,
        fontWeight: 'bold',
        dropShadow: { color: 0xff8800, blur: 8, distance: 0, angle: 0 },
      }),
    });
    this.balanceLabel.anchor.set(0.5);
    this.balanceLabel.y = -H / 2 + 295;
    this.container.addChild(this.balanceLabel);

    // Pack price info
    const priceText = new Text({
      text: `Pack Price: $${PACK_PRICE.toFixed(2)}  •  5 Cards`,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 13, fill: 0x886644 }),
    });
    priceText.anchor.set(0.5);
    priceText.y = -H / 2 + 345;
    this.container.addChild(priceText);

    // Buy button
    this.buyBtn = this.buildButton(
      `OPEN PACK  $${PACK_PRICE.toFixed(2)}`,
      0xffcc00,
      0x1a0d00,
      () => {
        if (this.economy.canAffordPack()) EventBus.emit('pack:buy', undefined);
      },
    );
    this.buyBtn.y = -H / 2 + 400;
    this.container.addChild(this.buyBtn);

    // Deposit button
    const depositBtn = this.buildButton('+$50 DEPOSIT', 0x226633, 0xffffff, () => {
      this.economy.deposit(50);
    });
    depositBtn.y = -H / 2 + 460;
    this.container.addChild(depositBtn);

    // RTP info
    const report = computeRTPReport();
    const rtpText = new Text({
      text: `Theoretical RTP: ${(report.rtp * 100).toFixed(1)}%  •  95% target`,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 10, fill: 0x664433, align: 'center' }),
    });
    rtpText.anchor.set(0.5);
    rtpText.y = -H / 2 + 510;
    this.container.addChild(rtpText);

    // Session stats
    this.statsLabel = new Text({
      text: this.buildStatsText(),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 11,
        fill: 0x886644,
        align: 'center',
        lineHeight: 18,
      }),
    });
    this.statsLabel.anchor.set(0.5);
    this.statsLabel.y = -H / 2 + 560;
    this.container.addChild(this.statsLabel);

    // Bottom ornament
    const ornament = new Graphics();
    ornament.rect(-80, H / 2 - 30, 160, 1).fill({ color: 0x886600, alpha: 0.5 });
    this.container.addChild(ornament);

    const footer = new Text({
      text: '18+ • Play Responsibly • Demo Mode',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 9, fill: 0x443322, align: 'center' }),
    });
    footer.anchor.set(0.5);
    footer.y = H / 2 - 16;
    this.container.addChild(footer);
  }

  private buildPackArt(): void {
    const g = new Graphics();
    // Pack body
    g.roundRect(-55, -65, 110, 140, 8).fill(0x1a0800);
    g.roundRect(-55, -65, 110, 140, 8).stroke({ color: 0xcc9900, width: 3 });
    g.roundRect(-48, -58, 96, 126, 5).stroke({ color: 0x664400, width: 1 });

    // Pack symbol
    g.circle(0, -5, 28).fill({ color: 0xcc9900, alpha: 0.15 });
    g.circle(0, -5, 28).stroke({ color: 0xcc9900, width: 2 });

    // Pyramid symbol
    g.moveTo(0, -28).lineTo(24, 18).lineTo(-24, 18).lineTo(0, -28).fill({ color: 0xcc9900, alpha: 0.8 });

    // Five card count dots
    for (let i = 0; i < 5; i++) {
      g.circle(-32 + i * 16, 52, 4).fill(0xcc9900);
    }

    g.y = -H / 2 + 178;
    this.container.addChild(g);

    // Pack label
    const packLabel = new Text({
      text: 'ANCIENT PACK',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 11, fill: 0xcc9900, letterSpacing: 2 }),
    });
    packLabel.anchor.set(0.5);
    packLabel.y = -H / 2 + 238;
    this.container.addChild(packLabel);
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

    btn.on('pointerdown', () => {
      btn.scale.set(0.95);
      onClick();
    });
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
      `Packs opened: ${s.packsOpened}   Wagered: $${s.totalWagered.toFixed(2)}`,
      `Total won: $${s.totalWon.toFixed(2)}   Session RTP: ${rtp}`,
    ].join('\n');
  }

  updateBalance(balance: number): void {
    this.balanceLabel.text = `$${balance.toFixed(2)}`;
    this.statsLabel.text = this.buildStatsText();
    // Dim buy button if insufficient
    this.buyBtn.alpha = this.economy.canAffordPack() ? 1.0 : 0.4;
  }

  show(): void { this.container.visible = true; }
  hide(): void { this.container.visible = false; }

  destroy(): void { this.container.destroy({ children: true }); }
}
