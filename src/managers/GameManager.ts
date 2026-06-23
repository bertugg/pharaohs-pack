import { Application, Container, Graphics, Ticker } from 'pixi.js';
import { EconomyManager } from '../game/economy/EconomyManager';
import { PackGenerator } from '../game/packSystem/PackGenerator';
import { LobbyScreen } from '../ui/LobbyScreen';
import { PackOpeningScreen } from '../ui/PackOpeningScreen';
import { ResultScreen } from '../ui/ResultScreen';
import { AudioManager } from './AudioManager';
import { EventBus } from './EventBus';
import type { Pack } from '../game/packSystem/PackGenerator';

type Screen = 'lobby' | 'opening' | 'results';

export class GameManager {
  private app: Application;
  private economy: EconomyManager;
  private packGen: PackGenerator;
  private lobby!: LobbyScreen;
  private opening!: PackOpeningScreen;
  private results!: ResultScreen;
  private currentScreen: Screen = 'lobby';
  private currentPack: Pack | null = null;
  private root!: Container;
  private bgTicker!: Ticker;

  constructor(app: Application) {
    this.app = app;
    this.economy = new EconomyManager(100);
    this.packGen = new PackGenerator();
  }

  async init(): Promise<void> {
    AudioManager.init();

    // Root container centred in the canvas
    this.root = new Container();
    this.root.x = this.app.screen.width / 2;
    this.root.y = this.app.screen.height / 2;
    this.app.stage.addChild(this.root);

    // Full-screen background
    this.buildBackground();

    // Screens
    this.lobby   = new LobbyScreen(this.economy);
    this.opening = new PackOpeningScreen(this.economy);
    this.results = new ResultScreen(this.economy);

    this.root.addChild(this.lobby.container);
    this.root.addChild(this.opening.container);
    this.root.addChild(this.results.container);

    this.opening.hide();
    this.results.hide();

    // Wire events
    EventBus.on('pack:buy',      () => this.handleBuyPack());
    EventBus.on('screen:lobby',  () => this.goTo('lobby'));
    EventBus.on('screen:opening',() => this.goTo('opening'));
    EventBus.on('screen:results',() => this.goTo('results'));

    // Ambient background animation
    this.bgTicker = new Ticker();
    this.bgTicker.add(this.onBgTick.bind(this));
    this.bgTicker.start();

    // Handle resize
    window.addEventListener('resize', () => this.onResize());
    this.onResize();
  }

  private buildBackground(): void {
    const { width: W, height: H } = this.app.screen;
    const bg = new Graphics();
    // Deep desert night sky gradient (bottom half lighter)
    bg.rect(-W / 2, -H / 2, W, H / 2).fill(0x06030a);
    bg.rect(-W / 2, 0, W, H / 2).fill(0x0d0600);

    // Stars
    for (let i = 0; i < 80; i++) {
      const x = (Math.random() - 0.5) * W;
      const y = (Math.random() - 0.5) * (H / 2) - 20;
      const r = 0.5 + Math.random() * 1.5;
      bg.circle(x, y, r).fill({ color: 0xffffff, alpha: 0.4 + Math.random() * 0.6 });
    }

    // Pyramid silhouette on horizon
    const ph = 80;
    bg.moveTo(-200, H * 0.08).lineTo(0, H * 0.08 - ph).lineTo(200, H * 0.08).fill({ color: 0x0a0500, alpha: 0.9 });
    bg.moveTo(80, H * 0.08).lineTo(200, H * 0.08 - ph * 0.6).lineTo(340, H * 0.08).fill({ color: 0x0c0600, alpha: 0.8 });

    // Sand ground
    bg.rect(-W / 2, H * 0.08, W, H).fill(0x1a0a00);

    this.app.stage.addChildAt(bg, 0);
  }

  private onBgTick(_ticker: Ticker): void {
    // Gentle parallax / breathing — nothing expensive
    const t = performance.now() / 1000;
    // Very slight root bob
    if (this.currentScreen !== 'opening') {
      this.root.y = this.app.screen.height / 2 + Math.sin(t * 0.4) * 2;
    }

    // Update results particles
    if (this.currentScreen === 'results') {
      this.results.update(_ticker.deltaTime / 60);
    }
  }

  private async handleBuyPack(): Promise<void> {
    if (!this.economy.canAffordPack()) return;
    this.economy.buyPack();
    const pack = this.packGen.generatePack();
    this.currentPack = pack;
    EventBus.emit('pack:generated', pack);
    await this.opening.setPack(pack);
    this.goTo('opening');
  }

  private goTo(screen: Screen): void {
    this.lobby.hide();
    this.opening.hide();
    this.results.hide();

    this.currentScreen = screen;

    switch (screen) {
      case 'lobby':
        this.lobby.show();
        break;
      case 'opening':
        this.opening.show();
        break;
      case 'results':
        if (this.currentPack) this.results.showResults(this.currentPack);
        this.results.show();
        break;
    }
  }

  private onResize(): void {
    const W = window.innerWidth;
    const H = window.innerHeight;
    this.app.renderer.resize(W, H);
    if (this.root) {
      this.root.x = W / 2;
      this.root.y = H / 2;
    }

    // Clamp lobby/result scale for mobile portrait
    const scale = Math.min(1, W / 440, H / 720);
    this.lobby.container.scale.set(scale);
    this.results.container.scale.set(scale);

    // Opening screen cards scale
    const openScale = Math.min(1, W / 800, H / 680);
    this.opening.container.scale.set(openScale);
  }
}
