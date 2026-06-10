import type { PlanetId } from "./types";

/**
 * Ashtakavarga benefic-place tables (BPHS). For each "subject" planet, the table
 * lists — for every reference body (the seven grahas + the Lagna) — the houses
 * (counted from that reference) where the subject contributes one bindu.
 */
type Ref = PlanetId | "Lagna";

const REFS: Ref[] = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Lagna",
];

const BENEFIC_PLACES: Record<string, Record<Ref, number[]>> = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11],
    Moon: [3, 6, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11],
    Venus: [6, 7, 12],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna: [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11],
    Moon: [1, 3, 6, 7, 10, 11],
    Mars: [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 2, 4, 7, 8, 10, 11],
    Venus: [3, 4, 5, 7, 9, 10, 11],
    Saturn: [3, 5, 6, 11],
    Lagna: [3, 6, 10, 11],
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11],
    Moon: [3, 6, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12],
    Venus: [6, 8, 11, 12],
    Saturn: [1, 4, 7, 8, 9, 10, 11],
    Lagna: [1, 3, 6, 10, 11],
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12],
    Moon: [2, 4, 6, 8, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12],
    Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna: [1, 2, 4, 6, 8, 10, 11],
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon: [2, 5, 7, 9, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    Venus: [2, 5, 6, 9, 10, 11],
    Saturn: [3, 5, 6, 12],
    Lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  Venus: {
    Sun: [8, 11, 12],
    Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars: [3, 5, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11],
    Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn: [3, 4, 5, 8, 9, 10, 11],
    Lagna: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11],
    Moon: [3, 6, 11],
    Mars: [3, 5, 6, 10, 11, 12],
    Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12],
    Venus: [6, 11, 12],
    Saturn: [3, 5, 6, 11],
    Lagna: [1, 3, 4, 6, 10, 11],
  },
};

const SUBJECTS: PlanetId[] = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
];

export interface AshtakavargaResult {
  /** Bhinnashtakavarga: bindus per sign (0-11) for each of the 7 planets. */
  bav: Record<PlanetId, number[]>;
  /** Sarvashtakavarga: total bindus per sign (0-11). */
  sav: number[];
}

/**
 * Compute Bhinna- and Sarva-ashtakavarga from the sign positions (0-11) of the
 * seven grahas plus the ascendant.
 */
export function computeAshtakavarga(
  planetSigns: Record<PlanetId, number>,
  lagnaSign: number,
): AshtakavargaResult {
  const refSign = (r: Ref): number =>
    r === "Lagna" ? lagnaSign : planetSigns[r];

  const bav = {} as Record<PlanetId, number[]>;
  const sav = new Array(12).fill(0);

  for (const subject of SUBJECTS) {
    const counts = new Array(12).fill(0);
    const table = BENEFIC_PLACES[subject];
    for (const ref of REFS) {
      const base = refSign(ref);
      for (const house of table[ref]) {
        const sign = (base + house - 1) % 12;
        counts[sign] += 1;
      }
    }
    bav[subject] = counts;
    for (let s = 0; s < 12; s++) sav[s] += counts[s];
  }

  return { bav, sav };
}
