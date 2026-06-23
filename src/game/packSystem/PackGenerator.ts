import { CARD_DEFINITIONS, TOTAL_WEIGHT, type CardDef } from '../cards/CardDefinitions';
import { RNGService } from './RNGService';
import { CARDS_PER_PACK } from '../math/RTPModel';

export interface Pack {
  id: string;
  cards: CardDef[];
  totalPayout: number;
  seed: number;
}

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

    const totalPayout = cards.reduce((s, c) => s + c.payout, 0);

    return {
      id: `pack_${Date.now()}_${seed}`,
      cards,
      totalPayout,
      seed,
    };
  }
}
