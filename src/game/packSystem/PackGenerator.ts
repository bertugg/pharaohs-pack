import { CARD_DEFINITIONS, TOTAL_WEIGHT, type CardDef } from '../cards/CardDefinitions';
import { RNGService } from './RNGService';
import { CARDS_PER_PACK } from '../math/RTPModel';

export interface Pack {
  id: string;
  cards: CardDef[];
  totalPayout: number;
  seed: number;
}

// Precomputed uncommon-only pool for the guaranteed-minimum draw.
// EV of this pool ≈ $0.4854; used to bump all-common packs up to the floor.
const UNCOMMON_POOL  = CARD_DEFINITIONS.filter(c => c.rarity === 'uncommon');
const UNCOMMON_TOTAL = UNCOMMON_POOL.reduce((s, c) => s + c.weight, 0);

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

    const cards: CardDef[] = [];
    for (let i = 0; i < CARDS_PER_PACK; i++) {
      cards.push(packRng.weightedPick(CARD_DEFINITIONS, TOTAL_WEIGHT));
    }

    // Guarantee: every pack has at least 1 uncommon or better.
    // If all 5 landed on common, replace one random card with an uncommon draw.
    // divine_throne payout is reduced by $7 to offset the EV gain this introduces
    // (P(all common)=0.68^5≈14.5% × $0.367 avg uplift ≈ +$0.053/pack → RTP +1.07%).
    if (cards.every(c => c.rarity === 'common')) {
      const replaceIdx = packRng.nextInt(CARDS_PER_PACK);
      cards[replaceIdx] = packRng.weightedPick(UNCOMMON_POOL, UNCOMMON_TOTAL);
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
