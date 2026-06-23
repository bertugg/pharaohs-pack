export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface CardDef {
  id: string;
  name: string;
  rarity: Rarity;
  payout: number;
  weight: number;
  description: string;
  glowColor: number;
  artworkDesc: string;
}

// ---------------------------------------------------------------------------
// RTP Model  (total weight = 10 000)
//
// Expected value per card slot:
//   EV = Σ (weight/10000 × payout) = $0.953
//
// Per pack (5 cards) EV = $4.765  →  RTP = 4.765 / 5.00 = 95.3%
// ---------------------------------------------------------------------------

export const CARD_DEFINITIONS: CardDef[] = [
  // ── COMMON (total weight 6500, EV ≈ $0.1055) ─────────────────────────────
  {
    id: 'desert_scarab',
    name: 'Desert Scarab',
    rarity: 'common',
    payout: 0.05,
    weight: 2500,
    glowColor: 0x888888,
    description: 'A tiny scarab carved from desert stone.',
    artworkDesc: 'Small stone scarab beetle on sandy ground, hieroglyphics border',
  },
  {
    id: 'sand_relic',
    name: 'Sand Relic',
    rarity: 'common',
    payout: 0.15,
    weight: 1800,
    glowColor: 0x888888,
    description: 'A fragment of ancient pottery found in the dunes.',
    artworkDesc: 'Cracked pottery shard with faded paint, desert backdrop',
  },
  {
    id: 'clay_tablet',
    name: 'Clay Tablet',
    rarity: 'common',
    payout: 0.25,
    weight: 1200,
    glowColor: 0x888888,
    description: 'A clay tablet inscribed with ancient script.',
    artworkDesc: 'Flat clay tablet covered in hieroglyphic writing',
  },
  {
    id: 'nile_coin',
    name: 'Nile Coin',
    rarity: 'common',
    payout: 0.30,
    weight: 700,
    glowColor: 0x888888,
    description: 'A worn bronze coin from the Nile traders.',
    artworkDesc: 'Old bronze coin with pyramid embossed, blue Nile in background',
  },
  {
    id: 'pharaoh_seal',
    name: 'Pharaoh Seal',
    rarity: 'common',
    payout: 0.50,
    weight: 200,
    glowColor: 0x888888,
    description: 'An official wax seal bearing the royal cartouche.',
    artworkDesc: 'Red wax seal stamped with cartouche, royal blue ribbon',
  },
  {
    id: 'anubis_fragment',
    name: 'Anubis Fragment',
    rarity: 'common',
    payout: 0.50,
    weight: 100,
    glowColor: 0x888888,
    description: 'A shard from an Anubis statue.',
    artworkDesc: 'Black obsidian fragment shaped like Anubis jackal head',
  },

  // ── UNCOMMON (total weight 2000, EV ≈ $0.1975) ───────────────────────────
  {
    id: 'golden_scarab',
    name: 'Golden Scarab',
    rarity: 'uncommon',
    payout: 0.50,
    weight: 800,
    glowColor: 0x00cc44,
    description: 'A scarab crafted from pure gold leaf.',
    artworkDesc: 'Gleaming gold scarab beetle, green gemstone eyes',
  },
  {
    id: 'temple_key',
    name: 'Temple Key',
    rarity: 'uncommon',
    payout: 0.75,
    weight: 600,
    glowColor: 0x00cc44,
    description: 'A bronze key that opens the inner sanctum.',
    artworkDesc: 'Ornate bronze key with ankh handle, temple doorway behind',
  },
  {
    id: 'eye_of_horus',
    name: 'Eye of Horus',
    rarity: 'uncommon',
    payout: 1.75,
    weight: 400,
    glowColor: 0x00cc44,
    description: 'The sacred eye symbol of protection and power.',
    artworkDesc: 'Vivid Eye of Horus amulet, painted in blue and gold on lapis lazuli',
  },
  {
    id: 'sun_disc',
    name: 'Sun Disc',
    rarity: 'uncommon',
    payout: 2.00,
    weight: 150,
    glowColor: 0x00cc44,
    description: 'A polished disc engraved with the solar barque.',
    artworkDesc: 'Gold disc with Ra\'s solar barque sailing across the sky',
  },
  {
    id: 'sacred_falcon',
    name: 'Sacred Falcon',
    rarity: 'uncommon',
    payout: 2.50,
    weight: 50,
    glowColor: 0x00cc44,
    description: 'A figurine of Horus in his falcon form.',
    artworkDesc: 'Lapus lazuli falcon figurine with golden crown',
  },

  // ── RARE (total weight 1000, EV ≈ $0.246) ────────────────────────────────
  {
    id: 'anubis_blessing',
    name: 'Anubis Blessing',
    rarity: 'rare',
    payout: 1.50,
    weight: 400,
    glowColor: 0x0088ff,
    description: 'A blessing granted by Anubis, guide of souls.',
    artworkDesc: 'Anubis in profile holding ankh and was sceptre, golden light',
  },
  {
    id: 'pharaohs_treasure',
    name: "Pharaoh's Treasure",
    rarity: 'rare',
    payout: 2.00,
    weight: 300,
    glowColor: 0x0088ff,
    description: 'Riches from the royal treasury.',
    artworkDesc: 'Overflowing chest of gold coins and jewels in a torch-lit chamber',
  },
  {
    id: 'cleopatras_jewel',
    name: "Cleopatra's Jewel",
    rarity: 'rare',
    payout: 3.00,
    weight: 200,
    glowColor: 0x0088ff,
    description: 'A sapphire worn by the last pharaoh.',
    artworkDesc: 'Deep blue sapphire necklace against Cleopatra\'s silhouette',
  },
  {
    id: 'golden_obelisk',
    name: 'Golden Obelisk',
    rarity: 'rare',
    payout: 6.00,
    weight: 70,
    glowColor: 0x0088ff,
    description: 'A miniature obelisk cast in solid gold.',
    artworkDesc: 'Gleaming golden obelisk covered in hieroglyphics, dawn sky',
  },
  {
    id: 'tomb_of_kings',
    name: 'Tomb of Kings',
    rarity: 'rare',
    payout: 8.00,
    weight: 30,
    glowColor: 0x0088ff,
    description: 'Access to the Valley of the Kings.',
    artworkDesc: 'Grand tomb entrance cut into cliff face, royal cartouches carved above',
  },

  // ── EPIC (total weight 400, EV ≈ $0.202) ─────────────────────────────────
  {
    id: 'wrath_of_ra',
    name: 'Wrath of Ra',
    rarity: 'epic',
    payout: 3.50,
    weight: 200,
    glowColor: 0xaa00ff,
    description: 'The sun god unleashes his fury upon the unworthy.',
    artworkDesc: 'Ra with blazing solar disc, desert below scorched by beams of light',
  },
  {
    id: 'crown_of_eternity',
    name: 'Crown of Eternity',
    rarity: 'epic',
    payout: 5.50,
    weight: 120,
    glowColor: 0xaa00ff,
    description: 'A crown that grants immortal rule.',
    artworkDesc: 'Double crown of Upper and Lower Egypt wreathed in divine light',
  },
  {
    id: 'eternal_pyramid',
    name: 'Eternal Pyramid',
    rarity: 'epic',
    payout: 7.00,
    weight: 60,
    glowColor: 0xaa00ff,
    description: 'The eternal monument of a thousand years.',
    artworkDesc: 'Great Pyramid gleaming in electrum casing, night sky full of stars',
  },
  {
    id: 'scepter_of_osiris',
    name: 'Scepter of Osiris',
    rarity: 'epic',
    payout: 12.00,
    weight: 20,
    glowColor: 0xaa00ff,
    description: 'The was-scepter wielded by Osiris, lord of the afterlife.',
    artworkDesc: 'Green-skinned Osiris holding crook and flail, underworld throne room',
  },

  // ── LEGENDARY (total weight 100, EV ≈ $0.202) ────────────────────────────
  {
    id: 'book_of_the_dead',
    name: 'Book of the Dead',
    rarity: 'legendary',
    payout: 12.00,
    weight: 50,
    glowColor: 0xffaa00,
    description: 'The sacred spells that guide souls through the afterlife.',
    artworkDesc: 'Ancient papyrus scroll glowing with golden hieroglyphics, Anubis watching',
  },
  {
    id: 'heart_of_ra',
    name: 'Heart of Ra',
    rarity: 'legendary',
    payout: 20.00,
    weight: 30,
    glowColor: 0xffaa00,
    description: 'The beating heart of the sun god himself.',
    artworkDesc: 'Pulsating golden heart radiating solar energy, all creation around it',
  },
  {
    id: 'treasure_of_tutankhamun',
    name: 'Treasure of Tutankhamun',
    rarity: 'legendary',
    payout: 28.00,
    weight: 15,
    glowColor: 0xffaa00,
    description: 'The legendary burial wealth of the boy-king.',
    artworkDesc: 'Golden death mask of Tutankhamun surrounded by mountains of treasure',
  },
  {
    id: 'divine_throne',
    name: 'Divine Throne',
    rarity: 'legendary',
    payout: 80.00,
    weight: 5,
    glowColor: 0xffaa00,
    description: 'The throne of the gods — sit upon it and rule eternity.',
    artworkDesc: 'Celestial throne of gold and lapis lazuli suspended among the stars',
  },
];

export const TOTAL_WEIGHT = CARD_DEFINITIONS.reduce((s, c) => s + c.weight, 0);

export const RARITY_CONFIG: Record<Rarity, { frameColor: number; glowColor: number; labelColor: string }> = {
  common:    { frameColor: 0x666666, glowColor: 0x888888, labelColor: '#aaaaaa' },
  uncommon:  { frameColor: 0x226622, glowColor: 0x00cc44, labelColor: '#00ee55' },
  rare:      { frameColor: 0x224488, glowColor: 0x0088ff, labelColor: '#44aaff' },
  epic:      { frameColor: 0x552288, glowColor: 0xaa00ff, labelColor: '#cc44ff' },
  legendary: { frameColor: 0x886600, glowColor: 0xffaa00, labelColor: '#ffcc00' },
};
