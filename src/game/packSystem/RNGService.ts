// Cryptographically-seeded RNG using a 64-bit LCG for deterministic,
// verifiable results. In a real money game the server would own this seed.
export class RNGService {
  private state: bigint;

  constructor(seed?: number) {
    // Use crypto.getRandomValues when no seed supplied (client-side demo only).
    if (seed !== undefined) {
      this.state = BigInt(seed) & 0xffffffffffffffffn;
    } else {
      const buf = new Uint32Array(2);
      crypto.getRandomValues(buf);
      this.state = (BigInt(buf[0]) << 32n) | BigInt(buf[1]);
    }
  }

  // Returns a float in [0, 1)
  next(): number {
    // Knuth / MMIX LCG parameters (64-bit)
    this.state = (this.state * 6364136223846793005n + 1442695040888963407n) & 0xffffffffffffffffn;
    // Use upper 53 bits for double precision
    return Number(this.state >> 11n) / Number(0x1fffffffffffffn);
  }

  // Returns an integer in [0, max)
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  // Weighted random selection — expects items with a `weight` property
  weightedPick<T extends { weight: number }>(items: T[], totalWeight: number): T {
    let r = this.next() * totalWeight;
    for (const item of items) {
      r -= item.weight;
      if (r <= 0) return item;
    }
    return items[items.length - 1];
  }
}
