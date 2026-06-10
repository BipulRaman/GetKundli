import type { DashaPeriod, PlanetId } from "./types";
import {
  DEG_PER_NAKSHATRA,
  NAKSHATRA_LORD,
  VIMSHOTTARI_ORDER,
} from "./constants";

const TOTAL_YEARS = 120;
const YEAR_MS = 365.25 * 24 * 3600 * 1000;

function yearsOf(lord: PlanetId): number {
  return VIMSHOTTARI_ORDER.find((v) => v.lord === lord)!.years;
}

function orderIndexOf(lord: PlanetId): number {
  return VIMSHOTTARI_ORDER.findIndex((v) => v.lord === lord);
}

/**
 * Build the Vimshottari Mahadasha timeline (with Antardashas) starting from the
 * Moon's sidereal longitude at birth.
 */
export function computeVimshottari(moonLongitude: number, birthUtc: Date): DashaPeriod[] {
  const nakshatra = Math.floor(moonLongitude / DEG_PER_NAKSHATRA) % 27;
  const startLord = NAKSHATRA_LORD[nakshatra];

  // Fraction of the current nakshatra already elapsed.
  const within = moonLongitude % DEG_PER_NAKSHATRA;
  const elapsedFraction = within / DEG_PER_NAKSHATRA;

  const firstLordYears = yearsOf(startLord);
  const balanceYears = firstLordYears * (1 - elapsedFraction);

  const periods: DashaPeriod[] = [];
  let cursor = birthUtc.getTime();
  const startIdx = orderIndexOf(startLord);

  for (let i = 0; i < 9; i++) {
    const lord = VIMSHOTTARI_ORDER[(startIdx + i) % 9].lord;
    const fullYears = yearsOf(lord);
    const durationYears = i === 0 ? balanceYears : fullYears;
    const start = new Date(cursor);
    const end = new Date(cursor + durationYears * YEAR_MS);

    periods.push({
      lord,
      start,
      end,
      children: buildAntardashas(lord, durationYears, start, i === 0 ? elapsedFraction : 0),
    });
    cursor = end.getTime();
  }

  return periods;
}

/**
 * Antardashas within a Mahadasha. For the first (partial) Mahadasha we skip the
 * portion that elapsed before birth so the timeline lines up correctly.
 */
function buildAntardashas(
  mahaLord: PlanetId,
  mahaDurationYears: number,
  mahaStart: Date,
  elapsedFractionOfMaha: number,
): DashaPeriod[] {
  const startIdx = orderIndexOf(mahaLord);
  const fullMahaYears = yearsOf(mahaLord);
  const children: DashaPeriod[] = [];

  // Time already consumed before birth within this Mahadasha (years).
  let consumed = elapsedFractionOfMaha * fullMahaYears;
  let cursor = mahaStart.getTime();

  for (let i = 0; i < 9; i++) {
    const lord = VIMSHOTTARI_ORDER[(startIdx + i) % 9].lord;
    const antarYears = (fullMahaYears * yearsOf(lord)) / TOTAL_YEARS;

    if (consumed >= antarYears) {
      consumed -= antarYears;
      continue; // this antardasha finished before birth
    }

    const remaining = antarYears - consumed;
    consumed = 0;
    const start = new Date(cursor);
    const end = new Date(cursor + remaining * YEAR_MS);
    children.push({
      lord,
      start,
      end,
      children: buildPratyantardashas(lord, antarYears, start, remaining),
    });
    cursor = end.getTime();
  }

  // Guard: ensure children don't overshoot the Mahadasha end (floating point).
  const mahaEnd = mahaStart.getTime() + mahaDurationYears * YEAR_MS;
  if (children.length) children[children.length - 1].end = new Date(mahaEnd);

  return children;
}

/**
 * Pratyantardashas (third level) within an Antardasha. The first one may be
 * partial when the antardasha was already running at the period's start.
 */
function buildPratyantardashas(
  antarLord: PlanetId,
  antarYears: number,
  antarStart: Date,
  remainingYears: number,
): DashaPeriod[] {
  const startIdx = orderIndexOf(antarLord);
  const children: DashaPeriod[] = [];

  // Skip the portion of this antardasha already elapsed before the period start.
  let consumed = antarYears - remainingYears;
  let cursor = antarStart.getTime();

  for (let i = 0; i < 9; i++) {
    const lord = VIMSHOTTARI_ORDER[(startIdx + i) % 9].lord;
    const pratYears = (antarYears * yearsOf(lord)) / TOTAL_YEARS;
    if (consumed >= pratYears) {
      consumed -= pratYears;
      continue;
    }
    const remaining = pratYears - consumed;
    consumed = 0;
    const start = new Date(cursor);
    const end = new Date(cursor + remaining * YEAR_MS);
    children.push({ lord, start, end });
    cursor = end.getTime();
  }

  const antarEnd = antarStart.getTime() + remainingYears * YEAR_MS;
  if (children.length) children[children.length - 1].end = new Date(antarEnd);

  return children;
}

/** Find the active Maha + Antar + Pratyantar dasha lords at a given date. */
export function findCurrentDasha(
  periods: DashaPeriod[],
  at: Date,
): { maha: PlanetId; antar: PlanetId; pratyantar?: PlanetId } | null {
  const t = at.getTime();
  for (const maha of periods) {
    if (t >= maha.start.getTime() && t < maha.end.getTime()) {
      const antar = maha.children?.find(
        (c) => t >= c.start.getTime() && t < c.end.getTime(),
      );
      if (!antar) return { maha: maha.lord, antar: maha.lord };
      const prat = antar.children?.find(
        (c) => t >= c.start.getTime() && t < c.end.getTime(),
      );
      return {
        maha: maha.lord,
        antar: antar.lord,
        pratyantar: prat ? prat.lord : antar.lord,
      };
    }
  }
  return null;
}
