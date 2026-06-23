import { Application } from 'pixi.js';
import { GameManager } from './managers/GameManager';

async function bootstrap(): Promise<void> {
  const app = new Application();

  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x06030a,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    preference: 'webgl',
  });

  document.getElementById('app')!.appendChild(app.canvas);

  const game = new GameManager(app);
  await game.init();
}

bootstrap().catch(console.error);
