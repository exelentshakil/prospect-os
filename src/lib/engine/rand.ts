// Deterministic pseudo-randomness. Every number the engine produces is a pure
// function of a seed string, so a rerun of the same prospect returns the same
// analysis, the same score and the same leakage estimate. This is what makes
// the output auditable rather than merely plausible.

export function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: string): () => number {
  let state = hash(seed) || 1;
  return () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

export function pick<T>(seed: string, items: readonly T[]): T {
  return items[hash(seed) % items.length];
}

export function between(seed: string, min: number, max: number, decimals = 0): number {
  const value = min + (hash(seed) % 100000) / 100000 * (max - min);
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function money(value: number): string {
  return "$" + Math.round(value).toLocaleString("en-US");
}
