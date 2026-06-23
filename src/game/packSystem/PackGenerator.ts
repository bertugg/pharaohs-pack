import { CARD_DEFINITIONS, type CardDef } from '../cards/CardDefinitions';
import { RNGService } from './RNGService';
import { CARDS_PER_PACK } from '../math/RTPModel';

export interface Pack {
  id: string;
  cards: CardDef[];
  totalPayout: number;
  seed: number;
}

// Per-pack rarity caps. common ≤3 guarantees ≥2 non-common cards per pack,
// which inherently satisfies the "at least 1 uncommon or rare" floor without
// a separate override.
const CAPS: Record<string, number> = {
  common: 3, uncommon: Infinity, rare: Infinity, epic: 2, legendary: 1,
};

// All pack contents are determined BEFORE any reveal animation begins.
// The server would do this; here we simulate it client-side.
export class PackGenerator {
  private rng: RNGService;

  constructor() {
    this.rng = new RNGService();
  }

  generatePack(): Pack {
    const seed = this.rng.nextInt(0xffffffff);
    const packRng = new RNGService(seed);

    const counts: Record<string, number> = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
    const cards: CardDef[] = [];

    for (let i = 0; i < CARDS_PER_PACK; i++) {
      const pool = CARD_DEFINITIONS.filter(c => counts[c.rarity] < CAPS[c.rarity]);
      const totalW = pool.reduce((s, c) => s + c.weight, 0);
      const card = packRng.weightedPick(pool, totalW);
      counts[card.rarity]++;
      cards.push(card);
    }

    const totalPayout = cards.reduce((s, c) => s + c.payout, 0);

    return {
      id: `pack_${Date.now()}_${seed}`,
      cards,
      totalPayout,
      seed,
    };
  }
}
