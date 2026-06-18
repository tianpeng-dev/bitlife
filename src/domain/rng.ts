import type { Weighted } from "./types";

function xmur3(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly Weighted<T>[]): T;
  fork(label: string): Rng;
}

export function createRng(seed: string): Rng {
  const seedFactory = xmur3(seed);
  const random = mulberry32(seedFactory());

  return {
    next() {
      return random();
    },
    int(min, max) {
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        throw new Error("Rng.int bounds must be finite numbers");
      }
      if (!Number.isInteger(min) || !Number.isInteger(max)) {
        throw new Error("Rng.int bounds must be integers");
      }
      if (min > max) {
        throw new Error("Rng.int min must be less than or equal to max");
      }
      return Math.floor(random() * (max - min + 1)) + min;
    },
    pick(items) {
      if (items.length === 0) throw new Error("Cannot pick from an empty array");
      return items[this.int(0, items.length - 1)];
    },
    weighted(items) {
      const total = items.reduce((sum, item) => {
        if (!Number.isFinite(item.weight)) {
          throw new Error("Weighted pick requires finite weights");
        }
        return item.weight > 0 ? sum + item.weight : sum;
      }, 0);
      if (!Number.isFinite(total) || total <= 0) {
        throw new Error("Weighted pick requires finite positive total weight");
      }
      let roll = random() * total;
      for (const item of items) {
        if (item.weight <= 0) continue;
        roll -= item.weight;
        if (roll <= 0) return item.value;
      }
      return items[items.length - 1].value;
    },
    fork(label) {
      return createRng(`${seed}:${label}`);
    }
  };
}
