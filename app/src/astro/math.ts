export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

/** Normalize an angle in degrees to the range [0, 360). */
export function norm360(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/** Julian centuries from J2000.0 (TT approximated by UTC; fine for astrology). */
export function julianCenturies(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

/** Julian Day Number for a JavaScript Date interpreted as UTC. */
export function jdFromDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}
