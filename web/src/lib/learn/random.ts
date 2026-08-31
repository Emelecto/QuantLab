// Deterministic PRNG so every chart, backtest and tournament is reproducible.
// mulberry32 — small, fast, good enough for demo data.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller standard normal from a uniform RNG.
export function gaussian(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Geometric brownian motion price series. Determinism => identical for same seed.
export function genPriceSeries(seed: number, n: number, drift = 0.0002, vol = 0.02): number[] {
  const rng = mulberry32(seed);
  const prices: number[] = [100];
  for (let i = 1; i < n; i++) {
    const shock = drift + vol * gaussian(rng);
    prices.push(prices[i - 1] * (1 + shock));
  }
  return prices;
}
