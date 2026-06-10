import type { PlanetId, PlanetPosition } from "./types";

export interface Dosha {
  name: string;
  present: boolean;
  detail: string;
}

/**
 * Mangal (Kuja / Manglik) dosha: Mars in houses 1, 2, 4, 7, 8 or 12 — checked
 * from the Lagna, the Moon and Venus.
 */
function mangalDosha(planets: Record<PlanetId, PlanetPosition>): Dosha {
  const marsHouse = planets.Mars.house;
  const badHouses = [1, 2, 4, 7, 8, 12];

  // Relative house of Mars from a reference sign.
  const relFromSign = (refSign: number) =>
    ((planets.Mars.sign - refSign + 12) % 12) + 1;

  const fromLagnaHouse = marsHouse; // already lagna-relative
  const fromMoon = relFromSign(planets.Moon.sign);
  const fromVenus = relFromSign(planets.Venus.sign);

  const flags: string[] = [];
  if (badHouses.includes(fromLagnaHouse)) flags.push(`Lagna (house ${fromLagnaHouse})`);
  if (badHouses.includes(fromMoon)) flags.push(`Moon (house ${fromMoon})`);
  if (badHouses.includes(fromVenus)) flags.push(`Venus (house ${fromVenus})`);

  return {
    name: "Mangal (Manglik) Dosha",
    present: flags.length > 0,
    detail: flags.length
      ? `Mars afflicts: ${flags.join(", ")}. Considered in matchmaking; strength reduces with age and cancellations.`
      : "Mars does not occupy the dosha houses from Lagna, Moon or Venus.",
  };
}

/**
 * Kaal Sarp dosha: all seven grahas hemmed between the Rahu-Ketu axis.
 */
function kaalSarpDosha(planetList: PlanetPosition[]): Dosha {
  const rahu = planetList.find((p) => p.id === "Rahu")!;
  const ketu = planetList.find((p) => p.id === "Ketu")!;
  const others = planetList.filter(
    (p) => p.id !== "Rahu" && p.id !== "Ketu",
  );

  // Arc from Rahu to Ketu (going forward in zodiac).
  const start = rahu.longitude;
  const arc = (ketu.longitude - start + 360) % 360;

  let allOneSide = true;
  let side: boolean | null = null;
  for (const p of others) {
    const rel = (p.longitude - start + 360) % 360;
    const onFirstSide = rel <= arc;
    if (side === null) side = onFirstSide;
    else if (side !== onFirstSide) {
      allOneSide = false;
      break;
    }
  }

  return {
    name: "Kaal Sarp Dosha",
    present: allOneSide,
    detail: allOneSide
      ? "All planets fall on one side of the Rahu-Ketu axis — full Kaal Sarp; can intensify life lessons and karmic delays."
      : "Planets lie on both sides of the Rahu-Ketu axis — no full Kaal Sarp dosha.",
  };
}

/**
 * Sade Sati: Saturn transiting the 12th, 1st or 2nd sign from the natal Moon.
 */
function sadeSati(natalMoonSign: number, transitSaturnSign: number): Dosha {
  const rel = ((transitSaturnSign - natalMoonSign + 12) % 12) + 1; // 1..12
  const inSadeSati = rel === 12 || rel === 1 || rel === 2;
  const phase =
    rel === 12 ? "rising (first) phase"
    : rel === 1 ? "peak (second) phase"
    : rel === 2 ? "setting (third) phase"
    : null;

  // Dhaiya (small panoti): Saturn in 4th or 8th from the Moon.
  const dhaiya = rel === 4 || rel === 8;

  return {
    name: "Sade Sati (current transit)",
    present: inSadeSati,
    detail: inSadeSati
      ? `Saturn is in the ${phase} of Sade Sati relative to your natal Moon — a period of hard work, maturity and karmic review.`
      : dhaiya
      ? "Not in Sade Sati, but Saturn forms Dhaiya (small panoti) — moderate Saturnine pressure."
      : "Saturn is not currently transiting the 12th/1st/2nd from your natal Moon.",
  };
}

export function detectDoshas(
  planetList: PlanetPosition[],
  natalMoonSign: number,
  transitSaturnSign: number,
): Dosha[] {
  const planets = {} as Record<PlanetId, PlanetPosition>;
  for (const p of planetList) planets[p.id] = p;

  return [
    mangalDosha(planets),
    kaalSarpDosha(planetList),
    sadeSati(natalMoonSign, transitSaturnSign),
  ];
}
