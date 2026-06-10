import * as Astronomy from "astronomy-engine";
import type { PlanetId } from "./types";
import { DEG2RAD, RAD2DEG, norm360, jdFromDate, julianCenturies } from "./math";
import { lahiriAyanamsa } from "./ayanamsa";

/** Mean obliquity of the ecliptic (degrees) for a given JD. */
export function meanObliquity(jd: number): number {
  const T = julianCenturies(jd);
  return (
    23.4392911 -
    0.0130041667 * T -
    1.63889e-7 * T * T +
    5.03611e-7 * T * T * T
  );
}

const ENGINE_BODY: Partial<Record<PlanetId, Astronomy.Body>> = {
  Sun: Astronomy.Body.Sun,
  Moon: Astronomy.Body.Moon,
  Mars: Astronomy.Body.Mars,
  Mercury: Astronomy.Body.Mercury,
  Jupiter: Astronomy.Body.Jupiter,
  Venus: Astronomy.Body.Venus,
  Saturn: Astronomy.Body.Saturn,
};

/**
 * Geocentric apparent ecliptic longitude of date (tropical) in degrees for one
 * of the seven visible bodies. Computed by rotating the J2000 equatorial vector
 * to the equator of date, then into the ecliptic of date.
 */
function tropicalLongitudeOfDate(body: Astronomy.Body, time: Astronomy.AstroTime): number {
  const eqj = Astronomy.GeoVector(body, time, true); // J2000 equatorial, aberration-corrected
  const rot = Astronomy.Rotation_EQJ_EQD(time); // J2000 -> equator of date
  const eqd = Astronomy.RotateVector(rot, eqj);

  const eps = meanObliquity(eqj.t.tt + 2451545.0) * DEG2RAD;
  const cosE = Math.cos(eps);
  const sinE = Math.sin(eps);
  // Rotate equatorial-of-date into ecliptic-of-date about the x-axis.
  const xe = eqd.x;
  const ye = eqd.y * cosE + eqd.z * sinE;
  return norm360(Math.atan2(ye, xe) * RAD2DEG);
}

/** Mean longitude of the Moon's ascending node (Rahu), tropical of date. */
function meanLunarNode(jd: number): number {
  const T = julianCenturies(jd);
  return norm360(
    125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000,
  );
}

export interface RawPlanet {
  id: PlanetId;
  siderealLongitude: number;
  retrograde: boolean;
}

/**
 * Compute sidereal longitudes (Lahiri) for all nine grahas at a UTC instant.
 */
export function computePlanets(utc: Date): { ayanamsa: number; planets: RawPlanet[] } {
  const time = Astronomy.MakeTime(utc);
  const jd = jdFromDate(utc);
  const ayan = lahiriAyanamsa(jd);

  const planets: RawPlanet[] = [];

  // Seven visible bodies.
  for (const id of ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as PlanetId[]) {
    const body = ENGINE_BODY[id]!;
    const lonNow = tropicalLongitudeOfDate(body, time);
    // Finite-difference speed to detect retrograde motion (skip Sun/Moon).
    let retrograde = false;
    if (id !== "Sun" && id !== "Moon") {
      const later = Astronomy.MakeTime(new Date(utc.getTime() + 6 * 3600 * 1000));
      const lonLater = tropicalLongitudeOfDate(body, later);
      let delta = lonLater - lonNow;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      retrograde = delta < 0;
    }
    planets.push({ id, siderealLongitude: norm360(lonNow - ayan), retrograde });
  }

  // Rahu / Ketu (mean node). Rahu is always retrograde in motion.
  const rahuTropical = meanLunarNode(jd);
  const rahu = norm360(rahuTropical - ayan);
  planets.push({ id: "Rahu", siderealLongitude: rahu, retrograde: true });
  planets.push({ id: "Ketu", siderealLongitude: norm360(rahu + 180), retrograde: true });

  return { ayanamsa: ayan, planets };
}

/**
 * Sidereal longitude of the ascendant (Lagna) in degrees.
 */
export function computeAscendant(utc: Date, latitude: number, longitude: number): number {
  const time = Astronomy.MakeTime(utc);
  const jd = jdFromDate(utc);
  const ayan = lahiriAyanamsa(jd);

  // Greenwich apparent sidereal time (hours) -> local sidereal time (degrees).
  const gast = Astronomy.SiderealTime(time); // hours
  const ramc = norm360(gast * 15 + longitude); // right ascension of the MC

  const eps = meanObliquity(jd) * DEG2RAD;
  const lat = latitude * DEG2RAD;
  const ramcRad = ramc * DEG2RAD;

  const y = Math.cos(ramcRad);
  const x = -(Math.sin(eps) * Math.tan(lat) + Math.cos(eps) * Math.sin(ramcRad));
  let asc = Math.atan2(y, x) * RAD2DEG;
  asc = norm360(asc);

  return norm360(asc - ayan);
}
