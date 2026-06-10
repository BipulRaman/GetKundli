import type { Ascendant, PlanetId, PlanetPosition } from "./types";
import { computeAscendant, computePlanets } from "./ephemeris";
import {
  degreeInSign,
  houseOf,
  nakshatraOf,
  navamsaSign,
  padaOf,
  signOf,
} from "./divisional";
import { SIGN_LORD } from "./dignity";
import {
  DEG_PER_NAKSHATRA,
  NAKSHATRA_LORD,
  VIMSHOTTARI_ORDER,
} from "./constants";
import type { DashaPeriod } from "./types";

const SIDEREAL_YEAR_DAYS = 365.25636;
const DAY_MS = 24 * 3600 * 1000;

/** Sidereal longitude of the Sun at a UTC instant. */
function sunSiderealAt(utc: Date): number {
  const { planets } = computePlanets(utc);
  return planets.find((p) => p.id === "Sun")!.siderealLongitude;
}

/**
 * Find the Varsha Pravesh (solar-return) instant for a given completed age:
 * the moment the Sun returns to its natal sidereal longitude.
 */
export function findSolarReturn(birthUtc: Date, natalSunSidereal: number, age: number): Date {
  // Initial guess: age sidereal years after birth.
  let t = birthUtc.getTime() + age * SIDEREAL_YEAR_DAYS * DAY_MS;
  const speedPerDay = 360 / SIDEREAL_YEAR_DAYS; // ~0.9856°/day

  for (let i = 0; i < 8; i++) {
    const lon = sunSiderealAt(new Date(t));
    let delta = natalSunSidereal - lon;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    if (Math.abs(delta) < 1e-5) break;
    t += (delta / speedPerDay) * DAY_MS;
  }
  return new Date(t);
}

export interface VarshphalChart {
  age: number;
  year: number;
  pravesh: Date; // UTC instant of solar return
  ascendant: Ascendant;
  planets: PlanetPosition[];
  muntha: { sign: number; house: number; lord: PlanetId };
  yearLord: PlanetId;
  muddaDasha: DashaPeriod[];
}

/** Build the annual (Varshphal) chart for a target age at a location. */
export function computeVarshphal(
  birthUtc: Date,
  natalSunSidereal: number,
  natalLagnaSign: number,
  natalMoonSidereal: number,
  latitude: number,
  longitude: number,
  age: number,
): VarshphalChart {
  const pravesh = findSolarReturn(birthUtc, natalSunSidereal, age);

  const { planets: raw } = computePlanets(pravesh);
  const ascLon = computeAscendant(pravesh, latitude, longitude);
  const ascSign = signOf(ascLon);

  const ascendant: Ascendant = {
    longitude: ascLon,
    sign: ascSign,
    degreeInSign: degreeInSign(ascLon),
    nakshatra: nakshatraOf(ascLon),
    pada: padaOf(ascLon),
  };

  const planets: PlanetPosition[] = raw.map((p) => ({
    id: p.id,
    longitude: p.siderealLongitude,
    sign: signOf(p.siderealLongitude),
    degreeInSign: degreeInSign(p.siderealLongitude),
    nakshatra: nakshatraOf(p.siderealLongitude),
    pada: padaOf(p.siderealLongitude),
    house: houseOf(p.siderealLongitude, ascSign),
    retrograde: p.retrograde,
  }));

  // Muntha: advances one sign per completed year from the natal lagna.
  const munthaSign = (natalLagnaSign + age) % 12;
  const muntha = {
    sign: munthaSign,
    house: ((munthaSign - ascSign + 12) % 12) + 1,
    lord: SIGN_LORD[munthaSign],
  };

  // Year lord (simplified): lord of the Muntha sign, a key Varshphal indicator.
  const yearLord = SIGN_LORD[munthaSign];

  // Mudda dasha: Vimshottari proportions compressed into ~360 days, starting
  // from the Janma-nakshatra lord at the year's beginning.
  const muddaDasha = buildMuddaDasha(natalMoonSidereal, pravesh);

  return {
    age,
    year: pravesh.getUTCFullYear(),
    pravesh,
    ascendant,
    planets,
    muntha,
    yearLord,
    muddaDasha,
  };
}

const VARSHA_DAYS = 360;

function yearsOf(lord: PlanetId): number {
  return VIMSHOTTARI_ORDER.find((v) => v.lord === lord)!.years;
}

/** Annual Mudda (Varshphal Vimshottari) dasha — total span ~360 days. */
function buildMuddaDasha(moonLongitude: number, start: Date): DashaPeriod[] {
  const nakshatra = Math.floor(moonLongitude / DEG_PER_NAKSHATRA) % 27;
  const startLord = NAKSHATRA_LORD[nakshatra];
  const startIdx = VIMSHOTTARI_ORDER.findIndex((v) => v.lord === startLord);

  const periods: DashaPeriod[] = [];
  let cursor = start.getTime();

  for (let i = 0; i < 9; i++) {
    const lord = VIMSHOTTARI_ORDER[(startIdx + i) % 9].lord;
    const days = (yearsOf(lord) / 120) * VARSHA_DAYS;
    const s = new Date(cursor);
    const e = new Date(cursor + days * DAY_MS);
    periods.push({ lord, start: s, end: e });
    cursor = e.getTime();
  }
  return periods;
}
