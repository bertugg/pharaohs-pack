import { Assets, Texture } from 'pixi.js';

const EXTS = ['jpg', 'jpeg', 'png', 'webp'];

async function probeExists(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok;
  } catch {
    return false;
  }
}

class AssetLoaderClass {
  private cache = new Map<string, Texture | null>();

  async loadFromCards(name: string): Promise<Texture | null> {
    if (this.cache.has(name)) return this.cache.get(name)!;
    for (const ext of EXTS) {
      const url = `${import.meta.env.BASE_URL}cards/${name}.${ext}`;
      if (await probeExists(url)) {
        try {
          const tex = await Assets.load<Texture>(url);
          this.cache.set(name, tex);
          return tex;
        } catch { /* try next ext */ }
      }
    }
    this.cache.set(name, null);
    return null;
  }

  loadCardArt(id: string): Promise<Texture | null>  { return this.loadFromCards(id); }
  loadCardBack(): Promise<Texture | null>             { return this.loadFromCards('card_back'); }
  loadPackImage(): Promise<Texture | null>            { return this.loadFromCards('pack_image'); }

  /** Loads an image from the public root (e.g. /background_pack.jpg). Returns null if missing. */
  async loadBackground(name: string): Promise<Texture | null> {
    const key = `bg:${name}`;
    if (this.cache.has(key)) return this.cache.get(key)!;
    for (const ext of EXTS) {
      const url = `${import.meta.env.BASE_URL}${name}.${ext}`;
      if (await probeExists(url)) {
        try {
          const tex = await Assets.load<Texture>(url);
          this.cache.set(key, tex);
          return tex;
        } catch { /* try next ext */ }
      }
    }
    this.cache.set(key, null);
    return null;
  }
}

export const AssetLoader = new AssetLoaderClass();
