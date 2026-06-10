import type { PlanetId, PlanetPosition } from "./types";
import { SIGN_LORD } from "./dignity";

export interface Yoga {
  name: string;
  description: string;
  strength: "Strong" | "Present";
}

interface Ctx {
  planets: Record<PlanetId, PlanetPosition>;
  ascSign: number;
  houseOfPlanet: (p: PlanetId) => number;
}

const KENDRAS = [1, 4, 7, 10];
const TRIKONAS = [1, 5, 9];

/** Houses (from a reference house) where a body sits, used for relative kendra checks. */
function relHouse(fromHouse: number, toHouse: number): number {
  return ((toHouse - fromHouse + 12) % 12) + 1;
}

/** Pancha Mahapurusha yoga: planet in own/exaltation sign placed in a kendra. */
function mahapurusha(
  ctx: Ctx,
  planet: PlanetId,
  ownSigns: number[],
  exaltSign: number,
  yogaName: string,
  desc: string,
): Yoga | null {
  const p = ctx.planets[planet];
  if (!p) return null;
  const inKendra = KENDRAS.includes(ctx.houseOfPlanet(planet));
  const dignified = ownSigns.includes(p.sign) || p.sign === exaltSign;
  if (inKendra && dignified) {
    return { name: yogaName, description: desc, strength: "Strong" };
  }
  return null;
}

/** Detect a curated set of classical yogas present in the chart. */
export function detectYogas(
  planetList: PlanetPosition[],
  ascSign: number,
): Yoga[] {
  const planets = {} as Record<PlanetId, PlanetPosition>;
  for (const p of planetList) planets[p.id] = p;

  const houseOfPlanet = (id: PlanetId) => planets[id].house;
  const ctx: Ctx = { planets, ascSign, houseOfPlanet };

  const yogas: Yoga[] = [];

  // Gajakesari: Jupiter in a kendra from the Moon.
  const jupFromMoon = relHouse(houseOfPlanet("Moon"), houseOfPlanet("Jupiter"));
  if (KENDRAS.includes(jupFromMoon)) {
    yogas.push({
      name: "Gajakesari Yoga",
      description:
        "Jupiter in a kendra (1/4/7/10) from the Moon — grants intelligence, virtue, reputation and lasting success.",
      strength: "Strong",
    });
  }

  // Budha-Aditya: Sun and Mercury in the same sign (conjunction). Retrograde
  // motion does not negate the yoga in classical texts.
  if (planets.Sun.sign === planets.Mercury.sign) {
    yogas.push({
      name: "Budha-Aditya Yoga",
      description:
        "Sun and Mercury conjoined — sharp intellect, communication skills and administrative ability.",
      strength: "Present",
    });
  }

  // Chandra-Mangala: Moon and Mars conjoined.
  if (planets.Moon.sign === planets.Mars.sign) {
    yogas.push({
      name: "Chandra-Mangala Yoga",
      description:
        "Moon with Mars — drive for wealth, enterprise and material resourcefulness.",
      strength: "Present",
    });
  }

  // Pancha Mahapurusha yogas.
  const ruchaka = mahapurusha(ctx, "Mars", [0, 7], 9, "Ruchaka Yoga",
    "Mars strong in a kendra — courage, leadership, physical vigour and command.");
  const bhadra = mahapurusha(ctx, "Mercury", [2, 5], 5, "Bhadra Yoga",
    "Mercury strong in a kendra — eloquence, scholarship and business acumen.");
  const hamsa = mahapurusha(ctx, "Jupiter", [8, 11], 3, "Hamsa Yoga",
    "Jupiter strong in a kendra — wisdom, righteousness, respect and prosperity.");
  const malavya = mahapurusha(ctx, "Venus", [1, 6], 11, "Malavya Yoga",
    "Venus strong in a kendra — beauty, comforts, artistic talent and luxury.");
  const sasa = mahapurusha(ctx, "Saturn", [9, 10], 6, "Sasa Yoga",
    "Saturn strong in a kendra — authority, discipline, endurance and influence.");
  for (const y of [ruchaka, bhadra, hamsa, malavya, sasa]) if (y) yogas.push(y);

  // Kemadruma: no planet (except Sun/nodes) in the 2nd/12th from the Moon nor
  // with it. Subject to the standard cancellations (bhanga) below.
  const moonHouse = houseOfPlanet("Moon");
  const adjacent = new Set([
    ((moonHouse - 2 + 12) % 12) + 1,
    (moonHouse % 12) + 1,
    moonHouse,
  ]);
  const hasNeighbour = planetList.some(
    (p) =>
      p.id !== "Moon" &&
      p.id !== "Sun" &&
      p.id !== "Rahu" &&
      p.id !== "Ketu" &&
      adjacent.has(p.house),
  );
  // Kemadruma bhanga (cancellation): nullified if the Moon itself is in a kendra
  // from the Lagna, or any planet (other than Sun/nodes) occupies a kendra
  // (4th/7th/10th) from the Moon.
  const moonInKendra = KENDRAS.includes(moonHouse);
  const planetInKendraFromMoon = planetList.some(
    (p) =>
      p.id !== "Moon" &&
      p.id !== "Sun" &&
      p.id !== "Rahu" &&
      p.id !== "Ketu" &&
      [4, 7, 10].includes(relHouse(moonHouse, p.house)),
  );
  if (!hasNeighbour && !moonInKendra && !planetInKendraFromMoon) {
    yogas.push({
      name: "Kemadruma Yoga",
      description:
        "Moon isolated (no planets in the 2nd/12th from it, and none in a kendra from it) — can bring struggle; mitigated by aspects and a dignified Moon.",
      strength: "Present",
    });
  }

  // Lagnesh in kendra/trikona — a simple Raja-yoga indicator.
  const lagnaLord = SIGN_LORD[ascSign];
  const lagnaLordHouse = houseOfPlanet(lagnaLord);
  if (KENDRAS.includes(lagnaLordHouse) || TRIKONAS.includes(lagnaLordHouse)) {
    yogas.push({
      name: "Lagnesh Raja Yoga",
      description: `Ascendant lord (${lagnaLord}) placed in a kendra/trikona (house ${lagnaLordHouse}) — supports status, stability and success.`,
      strength: "Present",
    });
  }

  return yogas;
}
