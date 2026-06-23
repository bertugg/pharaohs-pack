import { CARD_DEFINITIONS, TOTAL_WEIGHT, type Rarity } from '../cards/CardDefinitions';

export interface CardStats {
  id: string;
  name: string;
  rarity: Rarity;
  probability: number;
  payout: number;
  evContribution: number;
}

export interface RarityStats {
  rarity: Rarity;
  totalWeight: number;
  probability: number;
  evContribution: number;
}

export interface RTPReport {
  packPrice: number;
  cardsPerPack: number;
  evPerCard: number;
  evPerPack: number;
  rtp: number;
  cardStats: CardStats[];
  rarityStats: RarityStats[];
}

const PACK_PRICE = 5.00;
const CARDS_PER_PACK = 5;

export function computeRTPReport(): RTPReport {
  const cardStats: CardStats[] = CARD_DEFINITIONS.map((c) => {
    const probability = c.weight / TOTAL_WEIGHT;
    const evContribution = probability * c.payout;
    return { id: c.id, name: c.name, rarity: c.rarity, probability, payout: c.payout, evContribution };
  });

  const evPerCard = cardStats.reduce((s, c) => s + c.evContribution, 0);
  const evPerPack = evPerCard * CARDS_PER_PACK;
  const rtp = evPerPack / PACK_PRICE;

  const rarityMap = new Map<Rarity, RarityStats>();
  for (const c of CARD_DEFINITIONS) {
    const existing = rarityMap.get(c.rarity);
    if (existing) {
      existing.totalWeight += c.weight;
      existing.probability += c.weight / TOTAL_WEIGHT;
      existing.evContribution += (c.weight / TOTAL_WEIGHT) * c.payout;
    } else {
      rarityMap.set(c.rarity, {
        rarity: c.rarity,
        totalWeight: c.weight,
        probability: c.weight / TOTAL_WEIGHT,
        evContribution: (c.weight / TOTAL_WEIGHT) * c.payout,
      });
    }
  }

  return {
    packPrice: PACK_PRICE,
    cardsPerPack: CARDS_PER_PACK,
    evPerCard,
    evPerPack,
    rtp,
    cardStats,
    rarityStats: Array.from(rarityMap.values()),
  };
}

export { PACK_PRICE, CARDS_PER_PACK };
