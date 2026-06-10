import type { KundliResult, PlanetId } from "../astro/types";
import { vargaSign } from "../astro/vargas";

export interface SignCell {
  sign: number; // 0-11
  house: number; // 1-12 relative to lagna
  isLagna: boolean;
  planets: { id: PlanetId; retrograde: boolean }[];
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
    cells[p.sign].planets.push({ id: p.id, retrograde: p.retrograde });
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
    cells[sign].planets.push({ id: p.id, retrograde: p.retrograde });
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
    cells[sign].planets.push({ id: p.id, retrograde: p.retrograde });
  }
  return cells;
}
