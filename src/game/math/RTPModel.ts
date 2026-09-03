import { CARD_DEFINITIONS, PACK_PRICE, CARDS_PER_PACK, type Rarity } from '../cards/CardDefinitions';
import { PackGenerator } from '../packSystem/PackGenerator';

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

// Per-card weights alone don't determine drop rates: PackGenerator applies
// per-rarity caps (common≤3, epic≤2, legendary≤1) and a rare+ guarantee that
// both skew effective probabilities away from raw weight/TOTAL_WEIGHT. So RTP
// is measured empirically by actually running pack generation, rather than
// computed from a closed-form formula that would need to be kept in sync by
// hand every time PackGenerator's constraints change.
const SIMULATION_PACKS = 100_000;

let cachedReport: RTPReport | null = null;

export function computeRTPReport(): RTPReport {
  if (cachedReport) return cachedReport;

  const packGen = new PackGenerator();
  const cardDraws = new Map<string, number>();
  for (const c of CARD_DEFINITIONS) cardDraws.set(c.id, 0);
  let totalPayout = 0;

  for (let i = 0; i < SIMULATION_PACKS; i++) {
    const pack = packGen.generatePack();
    totalPayout += pack.totalPayout;
    for (const c of pack.cards) cardDraws.set(c.id, cardDraws.get(c.id)! + 1);
  }

  const totalCardsDrawn = SIMULATION_PACKS * CARDS_PER_PACK;
  const cardStats: CardStats[] = CARD_DEFINITIONS.map((c) => {
    const probability = cardDraws.get(c.id)! / totalCardsDrawn;
    const evContribution = probability * c.payout;
    return { id: c.id, name: c.name, rarity: c.rarity, probability, payout: c.payout, evContribution };
  });

  const evPerPack = totalPayout / SIMULATION_PACKS;
  const evPerCard = evPerPack / CARDS_PER_PACK;
  const rtp = evPerPack / PACK_PRICE;

  const rarityMap = new Map<Rarity, RarityStats>();
  for (const c of CARD_DEFINITIONS) {
    const stat = cardStats.find(s => s.id === c.id)!;
    const existing = rarityMap.get(c.rarity);
    if (existing) {
      existing.totalWeight += c.weight;
      existing.probability += stat.probability;
      existing.evContribution += stat.evContribution;
    } else {
      rarityMap.set(c.rarity, {
        rarity: c.rarity,
        totalWeight: c.weight,
        probability: stat.probability,
        evContribution: stat.evContribution,
      });
    }
  }

  cachedReport = {
    packPrice: PACK_PRICE,
    cardsPerPack: CARDS_PER_PACK,
    evPerCard,
    evPerPack,
    rtp,
    cardStats,
    rarityStats: Array.from(rarityMap.values()),
  };
  return cachedReport;
}

export { PACK_PRICE, CARDS_PER_PACK };
