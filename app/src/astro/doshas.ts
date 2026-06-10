import type { PlanetId, PlanetPosition } from "./types";

export interface Dosha {
  name: string;
  present: boolean;
  detail: string;
}

/**
 * Mangal (Kuja / Manglik) dosha.
 *
 * Mars in houses 1, 4, 7, 8 or 12 — checked from the Lagna, the Moon and
 * Venus (the three classical references). The 2nd house is intentionally
 * excluded: it is a weak/optional reference used only by some traditions and
 * is the main cause of over-detection.
 *
 * The raw placement is then tested against the standard cancellation
 * (Bhanga) rules. A genuine Manglik chart must have an active affliction that
 * is NOT cancelled.
 */
function mangalDosha(planets: Record<PlanetId, PlanetPosition>): Dosha {
  // Houses 1,4,7,8,12 are the conservative, widely-agreed set.
  const badHouses = [1, 4, 7, 8, 12];
  const mars = planets.Mars;

  // Relative house (1..12) of Mars from a reference sign.
  const relFromSign = (refSign: number) =>
    ((mars.sign - refSign + 12) % 12) + 1;

  const fromLagna = mars.house; // already lagna-relative
  const fromMoon = relFromSign(planets.Moon.sign);
  const fromVenus = relFromSign(planets.Venus.sign);

  const flags: string[] = [];
  if (badHouses.includes(fromLagna)) flags.push(`Lagna (house ${fromLagna})`);
  if (badHouses.includes(fromMoon)) flags.push(`Moon (house ${fromMoon})`);
  if (badHouses.includes(fromVenus)) flags.push(`Venus (house ${fromVenus})`);

  if (flags.length === 0) {
    return {
      name: "Mangal (Manglik) Dosha",
      present: false,
      detail: "Mars does not occupy houses 1, 4, 7, 8 or 12 from Lagna, Moon or Venus.",
    };
  }

  // ---- Cancellation (Mangal Dosha Bhanga) rules ----
  const ARIES = 0, GEMINI = 2, CANCER = 3, LEO = 4, VIRGO = 5,
        SCORPIO = 7, SAGITTARIUS = 8, CAPRICORN = 9, AQUARIUS = 10, PISCES = 11;

  const cancellations: string[] = [];

  // 1. Mars in its own sign (Aries/Scorpio) or exalted (Capricorn).
  if (mars.sign === ARIES || mars.sign === SCORPIO) {
    cancellations.push("Mars is in its own sign");
  } else if (mars.sign === CAPRICORN) {
    cancellations.push("Mars is exalted");
  }

  // 2. House-specific sign placements that nullify the dosha (classical list).
  const houseSignBhanga: Partial<Record<number, number[]>> = {
    1: [ARIES],
    4: [ARIES, SCORPIO],
    7: [CANCER, CAPRICORN],
    8: [SAGITTARIUS, PISCES],
    12: [GEMINI, VIRGO],
  };
  if (houseSignBhanga[fromLagna]?.includes(mars.sign)) {
    cancellations.push(`Mars sits in a benign sign for house ${fromLagna}`);
  }

  // 3. Conjunction with or aspect from a strong benefic (Jupiter / Moon).
  const sameSign = (a: PlanetPosition, b: PlanetPosition) => a.sign === b.sign;
  // Jupiter's special aspects fall on the 5th, 7th and 9th signs from it.
  const jupAspectsMars =
    ((mars.sign - planets.Jupiter.sign + 12) % 12 + 1);
  if (sameSign(mars, planets.Jupiter)) {
    cancellations.push("Mars is conjunct Jupiter");
  } else if ([5, 7, 9].includes(jupAspectsMars)) {
    cancellations.push("Mars is aspected by Jupiter");
  }
  if (sameSign(mars, planets.Moon)) {
    cancellations.push("Mars is conjunct the Moon");
  }

  // 4. Benefic signs Leo / Aquarius (Sun/Saturn ruled) temper the 2nd-line
  //    references when only Venus flags it.
  const onlyVenus = flags.length === 1 && badHouses.includes(fromVenus) &&
    !badHouses.includes(fromLagna) && !badHouses.includes(fromMoon);
  if (onlyVenus && (mars.sign === LEO || mars.sign === AQUARIUS)) {
    cancellations.push("Only a weak (Venus) reference, in a neutral sign");
  }

  const cancelled = cancellations.length > 0;

  return {
    name: "Mangal (Manglik) Dosha",
    present: !cancelled,
    detail: cancelled
      ? `Mars afflicts ${flags.join(", ")}, but the dosha is cancelled (Bhanga): ${cancellations.join("; ")}.`
      : `Mars afflicts ${flags.join(", ")} with no cancellation — genuine Manglik. Relevant in matchmaking; intensity reduces with age.`,
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
