import type { PlanetId } from "./types";

/** Ruling planet (sign lord) for each of the 12 signs. */
export const SIGN_LORD: PlanetId[] = [
  "Mars", // Aries
  "Venus", // Taurus
  "Mercury", // Gemini
  "Moon", // Cancer
  "Sun", // Leo
  "Mercury", // Virgo
  "Venus", // Libra
  "Mars", // Scorpio
  "Jupiter", // Sagittarius
  "Saturn", // Capricorn
  "Saturn", // Aquarius
  "Jupiter", // Pisces
];

/** Exaltation sign (0-11) and deep-exaltation degree for each planet. */
const EXALTATION: Partial<Record<PlanetId, { sign: number; deg: number }>> = {
  Sun: { sign: 0, deg: 10 }, // Aries 10°
  Moon: { sign: 1, deg: 3 }, // Taurus 3°
  Mars: { sign: 9, deg: 28 }, // Capricorn 28°
  Mercury: { sign: 5, deg: 15 }, // Virgo 15°
  Jupiter: { sign: 3, deg: 5 }, // Cancer 5°
  Venus: { sign: 11, deg: 27 }, // Pisces 27°
  Saturn: { sign: 6, deg: 20 }, // Libra 20°
};

/** Own signs for each planet. */
const OWN_SIGNS: Record<PlanetId, number[]> = {
  Sun: [4],
  Moon: [3],
  Mars: [0, 7],
  Mercury: [2, 5],
  Jupiter: [8, 11],
  Venus: [1, 6],
  Saturn: [9, 10],
  Rahu: [],
  Ketu: [],
};

/** Moolatrikona sign for the seven grahas. */
const MOOLATRIKONA: Partial<Record<PlanetId, number>> = {
  Sun: 4, // Leo
  Moon: 1, // Taurus
  Mars: 0, // Aries
  Mercury: 5, // Virgo
  Jupiter: 8, // Sagittarius
  Venus: 6, // Libra
  Saturn: 10, // Aquarius
};

/** Natural friendships (BPHS): friends and enemies; others are neutral. */
const FRIENDS: Record<PlanetId, PlanetId[]> = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
  Rahu: ["Venus", "Saturn", "Mercury"],
  Ketu: ["Mars", "Venus", "Saturn"],
};

const ENEMIES: Record<PlanetId, PlanetId[]> = {
  Sun: ["Venus", "Saturn"],
  Moon: [],
  Mars: ["Mercury"],
  Mercury: ["Moon"],
  Jupiter: ["Mercury", "Venus"],
  Venus: ["Sun", "Moon"],
  Saturn: ["Sun", "Moon", "Mars"],
  Rahu: ["Sun", "Moon", "Mars"],
  Ketu: ["Sun", "Moon"],
};

export type Dignity =
  | "Exalted"
  | "Debilitated"
  | "Moolatrikona"
  | "Own sign"
  | "Great friend"
  | "Friend"
  | "Neutral"
  | "Enemy"
  | "Great enemy";

/** Combustion orbs (degrees from the Sun) for each planet. */
const COMBUSTION_ORB: Partial<Record<PlanetId, number>> = {
  Moon: 12,
  Mars: 17,
  Mercury: 14,
  Jupiter: 11,
  Venus: 10,
  Saturn: 15,
};

export interface PlanetDignity {
  signLord: PlanetId;
  dignity: Dignity;
  exaltScore: number; // 0-100, how close to deep exaltation
  combust: boolean;
}

function relationDignity(planet: PlanetId, sign: number): Dignity {
  const lord = SIGN_LORD[sign];
  if (lord === planet) return "Own sign";
  if (FRIENDS[planet]?.includes(lord)) return "Friend";
  if (ENEMIES[planet]?.includes(lord)) return "Enemy";
  return "Neutral";
}

/** Determine the dignity of a planet at a given sidereal longitude. */
export function dignityOf(
  planet: PlanetId,
  longitude: number,
  sunLongitude: number,
  retrograde: boolean,
): PlanetDignity {
  const sign = Math.floor(longitude / 30) % 12;
  const deg = longitude % 30;
  const signLord = SIGN_LORD[sign];

  let dignity: Dignity;
  const ex = EXALTATION[planet];
  const debSign = ex ? (ex.sign + 6) % 12 : -1;

  if (ex && sign === ex.sign) {
    dignity = "Exalted";
  } else if (ex && sign === debSign) {
    dignity = "Debilitated";
  } else if (MOOLATRIKONA[planet] === sign) {
    dignity = "Moolatrikona";
  } else if (OWN_SIGNS[planet]?.includes(sign)) {
    dignity = "Own sign";
  } else {
    dignity = relationDignity(planet, sign);
  }

  // Exaltation proximity score (peaks at the deep-exaltation degree).
  let exaltScore = 0;
  if (ex) {
    const exaltLon = ex.sign * 30 + ex.deg;
    let diff = Math.abs(longitude - exaltLon);
    if (diff > 180) diff = 360 - diff;
    exaltScore = Math.max(0, Math.round((1 - diff / 180) * 100));
  }

  // Combustion (Rahu/Ketu and the Sun itself are never combust).
  let combust = false;
  const orb = COMBUSTION_ORB[planet];
  if (orb != null) {
    let diff = Math.abs(longitude - sunLongitude);
    if (diff > 180) diff = 360 - diff;
    const effective = retrograde && (planet === "Mercury" || planet === "Venus") ? orb - 2 : orb;
    combust = diff <= effective;
  }

  return { signLord, dignity, exaltScore, combust };
}
