import { CARD_DEFINITIONS, CARDS_PER_PACK, type CardDef } from '../cards/CardDefinitions';
import { RNGService } from './RNGService';

export interface Pack {
  id: string;
  cards: CardDef[];
  totalPayout: number;
  seed: number;
}

const CAPS: Record<string, number> = {
  common: 3, uncommon: Infinity, rare: Infinity, epic: 2, legendary: 1,
};

const RARE_POOL = CARD_DEFINITIONS.filter(c => c.rarity === 'rare');
const RARE_POOL_W = RARE_POOL.reduce((s, c) => s + c.weight, 0);

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

    // Guarantee at least 1 rare+ card per pack (~48% of packs need this).
    // Replace one uncommon with a weighted-random rare to keep EV in band.
    const hasRarePlus = cards.some(c => c.rarity === 'rare' || c.rarity === 'epic' || c.rarity === 'legendary');
    if (!hasRarePlus) {
      const ui = cards.findIndex(c => c.rarity === 'uncommon');
      if (ui !== -1) cards[ui] = packRng.weightedPick(RARE_POOL, RARE_POOL_W);
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
