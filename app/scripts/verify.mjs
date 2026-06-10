// Quick numeric sanity check of the ephemeris pipeline (run with: node scripts/verify.mjs)
import * as Astronomy from "astronomy-engine";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const norm360 = (d) => ((d % 360) + 360) % 360;
const jdFromDate = (date) => date.getTime() / 86400000 + 2440587.5;
const julianCenturies = (jd) => (jd - 2451545.0) / 36525;

function meanObliquity(jd) {
  const T = julianCenturies(jd);
  return 23.4392911 - 0.0130041667 * T - 1.63889e-7 * T * T + 5.03611e-7 * T ** 3;
}
function lahiri(jd) {
  const T = julianCenturies(jd);
  return 23.85304 + 1.396042 * T + 0.0003086 * T * T;
}
function tropOfDate(body, time) {
  const eqj = Astronomy.GeoVector(body, time, true);
  const rot = Astronomy.Rotation_EQJ_EQD(time);
  const eqd = Astronomy.RotateVector(rot, eqj);
  const eps = meanObliquity(eqj.t.tt + 2451545.0) * DEG2RAD;
  const xe = eqd.x;
  const ye = eqd.y * Math.cos(eps) + eqd.z * Math.sin(eps);
  return norm360(Math.atan2(ye, xe) * RAD2DEG);
}

const SIGNS = ["Ari","Tau","Gem","Can","Leo","Vir","Lib","Sco","Sag","Cap","Aqu","Pis"];
function fmt(lon) {
  const s = Math.floor(lon / 30);
  const d = lon - s * 30;
  return `${SIGNS[s]} ${d.toFixed(2)}°`;
}

// 1990-01-01 12:00 IST = 06:30 UTC, New Delhi
const utc = new Date(Date.UTC(1990, 0, 1, 6, 30, 0));
const time = Astronomy.MakeTime(utc);
const jd = jdFromDate(utc);
const ayan = lahiri(jd);
console.log("Ayanamsa:", ayan.toFixed(4));

for (const [name, body] of [
  ["Sun", Astronomy.Body.Sun],
  ["Moon", Astronomy.Body.Moon],
  ["Mars", Astronomy.Body.Mars],
  ["Jupiter", Astronomy.Body.Jupiter],
  ["Saturn", Astronomy.Body.Saturn],
]) {
  const trop = tropOfDate(body, time);
  console.log(name.padEnd(8), "sidereal:", fmt(norm360(trop - ayan)));
}

// Ascendant
const gast = Astronomy.SiderealTime(time);
const ramc = norm360(gast * 15 + 77.209);
const eps = meanObliquity(jd) * DEG2RAD;
const lat = 28.6139 * DEG2RAD;
const r = ramc * DEG2RAD;
let asc = norm360(Math.atan2(Math.cos(r), -(Math.sin(eps) * Math.tan(lat) + Math.cos(eps) * Math.sin(r))) * RAD2DEG);
console.log("Ascendant sidereal:", fmt(norm360(asc - ayan)));
