/**
 * Seeded pseudo-random number generator (Mulberry32)
 */
export function seededRandom(seed: number) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffles an array with an arbitrary numerical seed.
 */
export function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const copy = [...array];
  const rng = seededRandom(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Shuffles an array deterministically based on the current hour.
 * The order changes every 60 minutes, remaining consistent across
 * all users and paginated pages within that same hour.
 */
export function shuffleHourly<T>(array: T[]): T[] {
  const currentHourSeed = Math.floor(Date.now() / (1000 * 60 * 60));
  return shuffleWithSeed(array, currentHourSeed);
}
