import type {
  Ascendant,
  BirthInput,
  KundliResult,
  PlanetId,
  PlanetPosition,
} from "./types";
import { birthToUtc } from "./timeUtils";
import { computeAscendant, computePlanets } from "./ephemeris";
import { computeVimshottari, findCurrentDasha } from "./dasha";
import {
  degreeInSign,
  houseOf,
  nakshatraOf,
  navamsaSign,
  padaOf,
  signOf,
} from "./divisional";
import { computePanchang, type Panchang } from "./panchang";
import { dignityOf, type PlanetDignity } from "./dignity";
import { computeAshtakavarga, type AshtakavargaResult } from "./ashtakavarga";
import { detectYogas, type Yoga } from "./yogas";
import { detectDoshas, type Dosha } from "./doshas";

/** Full chart result enriched with panchang, dignities, ashtakavarga, yogas & doshas. */
export interface DetailedKundli extends KundliResult {
  panchang: Panchang;
  dignities: Record<PlanetId, PlanetDignity>;
  ashtakavarga: AshtakavargaResult;
  yogas: Yoga[];
  doshas: Dosha[];
  /** Natal Sun sidereal longitude, reused by Varshphal. */
  natalSunSidereal: number;
}

/** Run the full chart calculation for a birth input. */
export function generateKundli(input: BirthInput, now: Date = new Date()): DetailedKundli {
  const utc = birthToUtc(input);

  const { ayanamsa, planets: raw } = computePlanets(utc);
  const ascLon = computeAscendant(utc, input.latitude, input.longitude);
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

  const navamsaPlanets = {} as Record<PlanetId, number>;
  for (const p of raw) navamsaPlanets[p.id] = navamsaSign(p.siderealLongitude);

  const sun = raw.find((p) => p.id === "Sun")!;
  const moon = raw.find((p) => p.id === "Moon")!;

  const dashas = computeVimshottari(moon.siderealLongitude, utc);
  const currentDasha = findCurrentDasha(dashas, now);

  // Panchang (use the local weekday of the birth date).
  const localWeekday = new Date(input.year, input.month - 1, input.day).getDay();
  const panchang = computePanchang(
    sun.siderealLongitude,
    moon.siderealLongitude,
    nakshatraOf(moon.siderealLongitude),
    utc,
    input.latitude,
    input.longitude,
    localWeekday,
  );

  // Dignities & combustion.
  const dignities = {} as Record<PlanetId, PlanetDignity>;
  for (const p of raw) {
    dignities[p.id] = dignityOf(
      p.id,
      p.siderealLongitude,
      sun.siderealLongitude,
      p.retrograde,
    );
  }

  // Ashtakavarga.
  const planetSigns = {} as Record<PlanetId, number>;
  for (const p of planets) planetSigns[p.id] = p.sign;
  const ashtakavarga = computeAshtakavarga(planetSigns, ascSign);

  // Yogas.
  const yogas = detectYogas(planets, ascSign);

  // Doshas (Sade Sati needs the current transit Saturn sign).
  const { planets: nowPlanets } = computePlanets(now);
  const transitSaturn = nowPlanets.find((p) => p.id === "Saturn")!;
  const transitSaturnSign = signOf(transitSaturn.siderealLongitude);
  const moonSign = signOf(moon.siderealLongitude);
  const doshas = detectDoshas(planets, moonSign, transitSaturnSign);

  return {
    input,
    utcDate: utc,
    ayanamsa,
    ascendant,
    planets,
    navamsa: { ascendant: navamsaSign(ascLon), planets: navamsaPlanets },
    dashas,
    currentDasha,
    panchang,
    dignities,
    ashtakavarga,
    yogas,
    doshas,
    natalSunSidereal: sun.siderealLongitude,
  };
}
