import { julianCenturies } from "./math";

/**
 * Lahiri (Chitrapaksha) ayanamsa in degrees for a given Julian Day.
 *
 * Uses a polynomial anchored at J2000.0 that tracks the precession rate of
 * ~50.29"/yr. Matches Swiss Ephemeris Lahiri to within ~1 arc-minute across
 * the modern era, which is more than adequate for chart casting.
 */
export function lahiriAyanamsa(jd: number): number {
  const T = julianCenturies(jd);
  // Base value 23.853° at 2000-01-01, precessing 1.3967°/century.
  return 23.85304 + 1.396042 * T + 0.0003086 * T * T;
}
