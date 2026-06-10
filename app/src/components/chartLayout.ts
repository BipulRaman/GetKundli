import type { KundliResult, PlanetId } from "../astro/types";
import { vargaSign, vargaDegree } from "../astro/vargas";

export interface CellPlanet {
  id: PlanetId;
  retrograde: boolean;
  /** Degrees within the sign of this chart [0,30). */
  degree: number;
}

export interface SignCell {
  sign: number; // 0-11
  house: number; // 1-12 relative to lagna
  isLagna: boolean;
  planets: CellPlanet[];
}

/** Build per-sign occupancy data shared by all chart styles. */
export function buildSignCells(result: KundliResult): SignCell[] {
  const ascSign = result.ascendant.sign;
  const cells: SignCell[] = Array.from({ length: 12 }, (_, sign) => ({
    sign,
    house: ((sign - ascSign + 12) % 12) + 1,
    isLagna: sign === ascSign,
    planets: [],
  }));
  for (const p of result.planets) {
    cells[p.sign].planets.push({
      id: p.id,
      retrograde: p.retrograde,
      degree: p.degreeInSign,
    });
  }
  return cells;
}

/** For navamsa chart: occupancy keyed by D9 sign. */
export function buildNavamsaCells(result: KundliResult): SignCell[] {
  const ascSign = result.navamsa.ascendant;
  const cells: SignCell[] = Array.from({ length: 12 }, (_, sign) => ({
    sign,
    house: ((sign - ascSign + 12) % 12) + 1,
    isLagna: sign === ascSign,
    planets: [],
  }));
  for (const p of result.planets) {
    const sign = result.navamsa.planets[p.id];
    cells[sign].planets.push({
      id: p.id,
      retrograde: p.retrograde,
      degree: vargaDegree(p.longitude, 9),
    });
  }
  return cells;
}

/** Occupancy for any divisional chart (varga), computed from longitudes. */
export function buildVargaCells(result: KundliResult, factor: number): SignCell[] {
  const ascSign = vargaSign(result.ascendant.longitude, factor);
  const cells: SignCell[] = Array.from({ length: 12 }, (_, sign) => ({
    sign,
    house: ((sign - ascSign + 12) % 12) + 1,
    isLagna: sign === ascSign,
    planets: [],
  }));
  for (const p of result.planets) {
    const sign = vargaSign(p.longitude, factor);
    cells[sign].planets.push({
      id: p.id,
      retrograde: p.retrograde,
      degree: vargaDegree(p.longitude, factor),
    });
  }
  return cells;
}
