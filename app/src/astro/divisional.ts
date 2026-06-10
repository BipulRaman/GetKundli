import { DEG_PER_NAKSHATRA, DEG_PER_PADA, DEG_PER_SIGN } from "./constants";

export function signOf(longitude: number): number {
  return Math.floor(longitude / DEG_PER_SIGN) % 12;
}

export function degreeInSign(longitude: number): number {
  return longitude % DEG_PER_SIGN;
}

export function nakshatraOf(longitude: number): number {
  return Math.floor(longitude / DEG_PER_NAKSHATRA) % 27;
}

export function padaOf(longitude: number): number {
  const within = longitude % DEG_PER_NAKSHATRA;
  return Math.floor(within / DEG_PER_PADA) + 1;
}

/** Whole-sign house number (1-12) of a body relative to the ascendant sign. */
export function houseOf(longitude: number, ascSign: number): number {
  const sign = signOf(longitude);
  return ((sign - ascSign + 12) % 12) + 1;
}

/** Navamsa (D9) sign index 0-11 for a sidereal longitude. */
export function navamsaSign(longitude: number): number {
  return Math.floor(longitude / DEG_PER_PADA) % 12;
}
