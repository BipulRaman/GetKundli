import type { PlanetId } from "./types";
import type { Panchang } from "./panchang";
import { DEG2RAD, RAD2DEG, norm360 } from "./math";
import { vargaSign } from "./vargas";
import { uchchaBala, saptaVargaPoints } from "./dignity";

/**
 * Shadbala — the classical six-fold strength of the seven grahas. Values are
 * expressed in virupas (60 virupa = 1 rupa). The implementation follows the
 * Parashari framework; a few sub-balas that require data we do not track
 * (e.g. precise Cheshta Kendra, Abda/Masa lords) are reasonably approximated,
 * so treat the output as indicative rather than exam-grade.
 */

export const SHADBALA_PLANETS: PlanetId[] = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
];

/** Naisargika (natural) bala in virupas — fixed per planet. */
const NAISARGIKA: Record<string, number> = {
  Sun: 60,
  Moon: 51.43,
  Venus: 42.86,
  Jupiter: 34.29,
  Mercury: 25.71,
  Mars: 17.14,
  Saturn: 8.57,
};

/** Minimum Shadbala (in rupas) required for a planet to be deemed strong. */
const REQUIRED_RUPAS: Record<string, number> = {
  Sun: 5,
  Moon: 6,
  Mars: 5,
  Mercury: 7,
  Jupiter: 6.5,
  Venus: 5.5,
  Saturn: 5,
};

/** Chaldean order used to walk the planetary hours. */
const CHALDEAN: PlanetId[] = [
  "Saturn",
  "Jupiter",
  "Mars",
  "Sun",
  "Venus",
  "Mercury",
  "Moon",
];

const WEEKDAY_LORD: Record<string, PlanetId> = {
  Sunday: "Sun",
  Monday: "Moon",
  Tuesday: "Mars",
  Wednesday: "Mercury",
  Thursday: "Jupiter",
  Friday: "Venus",
  Saturday: "Saturn",
};

export interface BalaBreakdown {
  /** Each component in rupas (virupa / 60). */
  sthana: number;
  dig: number;
  kala: number;
  cheshta: number;
  naisargika: number;
  drik: number;
  total: number; // rupas
  required: number; // rupas
  ratio: number; // total / required
  rank: number; // 1 = strongest
}

export interface ShadbalaResult {
  planets: Record<string, BalaBreakdown>;
  /** Planet ids ordered strongest -> weakest. */
  order: PlanetId[];
}

export interface ShadbalaInput {
  planets: {
    id: PlanetId;
    longitude: number;
    sign: number;
    degreeInSign: number;
    house: number;
    retrograde: boolean;
  }[];
  ascendantLongitude: number;
  ayanamsa: number;
  panchang: Panchang;
  utcDate: Date;
  /** Local clock time of birth in fractional hours (0-24). */
  localHour: number;
}

function angularDistance(a: number, b: number): number {
  let d = Math.abs(norm360(a) - norm360(b));
  if (d > 180) d = 360 - d;
  return d;
}

/** Ojha-Yugma (odd/even) bala across rashi and navamsa, 0-30 virupa. */
function ojhaYugmaBala(id: PlanetId, rasiSign: number, navamsaSignIdx: number): number {
  const evenLover = id === "Moon" || id === "Venus";
  let b = 0;
  for (const s of [rasiSign, navamsaSignIdx]) {
    const odd = s % 2 === 0; // Aries (0) is the 1st (odd) sign
    if (evenLover ? !odd : odd) b += 15;
  }
  return b;
}

/** Drekkana bala, 15 virupa for the matching decanate. */
function drekkanaBala(id: PlanetId, degreeInSign: number): number {
  const dre = Math.floor(degreeInSign / 10); // 0,1,2
  const male = id === "Sun" || id === "Mars" || id === "Jupiter";
  const female = id === "Moon" || id === "Venus";
  if (male && dre === 0) return 15;
  if (female && dre === 2) return 15;
  if (!male && !female && dre === 1) return 15; // Mercury, Saturn (neutral)
  return 0;
}

/** Kendradi bala from the house position: kendra 60, panapara 30, apoklima 15. */
function kendradiBala(house: number): number {
  if ([1, 4, 7, 10].includes(house)) return 60;
  if ([2, 5, 8, 11].includes(house)) return 30;
  return 15;
}

const SAPTA_FACTORS = [1, 2, 3, 7, 9, 12, 30];

export function computeShadbala(input: ShadbalaInput): ShadbalaResult {
  const { ascendantLongitude, ayanamsa, panchang, utcDate, localHour } = input;

  // ---- Shared Kala-bala context ----
  const h = ((localHour % 24) + 24) % 24;
  const nocturnalStrength = (Math.abs(h - 12) / 12) * 60; // 60 at midnight

  // Paksha measure: 0 (new moon) .. 180 (full moon).
  let paksha = panchang.moonPhase;
  if (paksha > 180) paksha = 360 - paksha;

  // Day / night split for Tribhaga bala.
  const sunriseMs = panchang.sunrise?.getTime() ?? null;
  const sunsetMs = panchang.sunset?.getTime() ?? null;
  const birthMs = utcDate.getTime();
  let tribhagaLord: PlanetId | null = null;
  if (sunriseMs != null && sunsetMs != null && sunsetMs > sunriseMs) {
    const dayLen = sunsetMs - sunriseMs;
    const nightLen = 24 * 3600 * 1000 - dayLen;
    if (birthMs >= sunriseMs && birthMs < sunsetMs) {
      const idx = Math.min(2, Math.floor(((birthMs - sunriseMs) / dayLen) * 3));
      tribhagaLord = (["Mercury", "Sun", "Saturn"] as PlanetId[])[idx];
    } else {
      // Night: anchor the elapsed time relative to the nearest sunset.
      const nightStart = birthMs >= sunsetMs ? sunsetMs : sunriseMs - nightLen;
      const idx = Math.min(2, Math.max(0, Math.floor(((birthMs - nightStart) / nightLen) * 3)));
      tribhagaLord = (["Moon", "Venus", "Mars"] as PlanetId[])[idx];
    }
  }

  // Vara (weekday) lord.
  const varaLord = WEEKDAY_LORD[panchang.vara] ?? null;

  // Hora (planetary hour) lord — approx. 1-hour horas from sunrise.
  let horaLord: PlanetId | null = null;
  if (varaLord && sunriseMs != null) {
    const elapsedH = (birthMs - sunriseMs) / 3600000;
    const horaIdx = Math.floor(((elapsedH % 24) + 24) % 24);
    const startIdx = CHALDEAN.indexOf(varaLord);
    horaLord = CHALDEAN[(startIdx + horaIdx) % 7];
  }

  // Benefic / malefic classification for Drik bala & Paksha bala.
  const isBenefic = (id: PlanetId): boolean =>
    id === "Jupiter" || id === "Venus" || id === "Mercury" || id === "Moon";

  const signOfPlanet: Record<string, number> = {};
  for (const p of input.planets) signOfPlanet[p.id] = p.sign;

  // ---- Per-planet computation ----
  const raw: Record<string, { total: number } & BalaBreakdown> = {};

  for (const p of input.planets) {
    if (!SHADBALA_PLANETS.includes(p.id)) continue;
    const id = p.id;

    // 1) Sthana bala.
    const uchcha = uchchaBala(id, p.longitude);
    let saptaSum = 0;
    for (const f of SAPTA_FACTORS) saptaSum += saptaVargaPoints(id, vargaSign(p.longitude, f));
    const ojha = ojhaYugmaBala(id, p.sign, vargaSign(p.longitude, 9));
    const drek = drekkanaBala(id, p.degreeInSign);
    const sthanaV = uchcha + saptaSum + kendradiBala(p.house) + ojha + drek;

    // 2) Dig bala — strongest point depends on the planet's preferred direction.
    let strongLon: number;
    if (id === "Jupiter" || id === "Mercury") strongLon = ascendantLongitude; // East / 1st
    else if (id === "Moon" || id === "Venus") strongLon = ascendantLongitude + 90; // North / 4th
    else if (id === "Saturn") strongLon = ascendantLongitude + 180; // West / 7th
    else strongLon = ascendantLongitude + 270; // Sun, Mars — South / 10th
    const digV = (180 - angularDistance(p.longitude, strongLon)) / 3;

    // 3) Kala bala (several sub-components).
    let nathonnatha: number;
    if (id === "Mercury") nathonnatha = 60;
    else if (id === "Sun" || id === "Jupiter" || id === "Venus") nathonnatha = 60 - nocturnalStrength;
    else nathonnatha = nocturnalStrength; // Moon, Mars, Saturn

    const pakshaBala = isBenefic(id) ? paksha / 3 : (180 - paksha) / 3;

    let tribhaga = id === "Jupiter" ? 60 : 0; // Jupiter always gets it
    if (tribhagaLord === id) tribhaga += 60;

    const varaBala = varaLord === id ? 45 : 0;
    const horaBala = horaLord === id ? 60 : 0;

    // Ayana bala from declination (latitude ignored).
    const tropLon = norm360(p.longitude + ayanamsa) * DEG2RAD;
    const obliq = 23.4392811 * DEG2RAD;
    const dec = Math.asin(Math.sin(obliq) * Math.sin(tropLon)) * RAD2DEG;
    const northFav = id !== "Moon" && id !== "Saturn";
    let ayana = ((northFav ? 24 + dec : 24 - dec) / 48) * 60;
    ayana = Math.max(0, Math.min(60, ayana));

    const kalaV = nathonnatha + pakshaBala + tribhaga + varaBala + horaBala + ayana;

    // 4) Cheshta bala.
    let cheshtaV: number;
    if (id === "Sun") cheshtaV = ayana;
    else if (id === "Moon") cheshtaV = pakshaBala;
    else cheshtaV = p.retrograde ? 60 : 30; // simplified motional strength

    // 5) Naisargika bala.
    const naisargikaV = NAISARGIKA[id];

    // 6) Drik bala — net of full benefic / malefic aspects received.
    let drikV = 0;
    for (const other of input.planets) {
      if (!SHADBALA_PLANETS.includes(other.id) || other.id === id) continue;
      const dist = ((p.sign - other.sign + 12) % 12) + 1; // 1..12
      let aspects = dist === 7;
      if (other.id === "Mars") aspects = aspects || dist === 4 || dist === 8;
      if (other.id === "Jupiter") aspects = aspects || dist === 5 || dist === 9;
      if (other.id === "Saturn") aspects = aspects || dist === 3 || dist === 10;
      if (aspects) drikV += isBenefic(other.id) ? 15 : -15;
    }

    const totalV = sthanaV + digV + kalaV + cheshtaV + naisargikaV + drikV;
    raw[id] = {
      sthana: sthanaV / 60,
      dig: digV / 60,
      kala: kalaV / 60,
      cheshta: cheshtaV / 60,
      naisargika: naisargikaV / 60,
      drik: drikV / 60,
      total: totalV / 60,
      required: REQUIRED_RUPAS[id],
      ratio: totalV / 60 / REQUIRED_RUPAS[id],
      rank: 0,
    };
  }

  const order = [...SHADBALA_PLANETS].sort((a, b) => raw[b].total - raw[a].total);
  order.forEach((id, i) => {
    raw[id].rank = i + 1;
  });

  return { planets: raw, order };
}
