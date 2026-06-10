import * as Astronomy from "astronomy-engine";
import { norm360 } from "./math";

export interface Panchang {
  vara: string; // weekday
  tithi: { index: number; name: string; paksha: string };
  nakshatra: { index: number; name: string };
  yoga: { index: number; name: string };
  karana: { index: number; name: string };
  sunrise: Date | null;
  sunset: Date | null;
  moonPhase: number; // 0-360 elongation
}

const VARAS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const TITHI_NAMES = [
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Purnima/Amavasya",
];

const YOGA_NAMES = [
  "Vishkambha",
  "Priti",
  "Ayushman",
  "Saubhagya",
  "Shobhana",
  "Atiganda",
  "Sukarma",
  "Dhriti",
  "Shula",
  "Ganda",
  "Vriddhi",
  "Dhruva",
  "Vyaghata",
  "Harshana",
  "Vajra",
  "Siddhi",
  "Vyatipata",
  "Variyana",
  "Parigha",
  "Shiva",
  "Siddha",
  "Sadhya",
  "Shubha",
  "Shukla",
  "Brahma",
  "Indra",
  "Vaidhriti",
];

const MOVABLE_KARANAS = [
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Gara",
  "Vanija",
  "Vishti",
];

const NAKSHATRA_NAMES = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];

function karanaName(k: number): string {
  // k is the half-tithi index 0..59 over a lunar month.
  if (k === 0) return "Kimstughna";
  if (k >= 1 && k <= 56) return MOVABLE_KARANAS[(k - 1) % 7];
  if (k === 57) return "Shakuni";
  if (k === 58) return "Chatushpada";
  return "Naga";
}

/**
 * Compute the Panchang (five limbs) from sidereal Sun & Moon longitudes plus the
 * civil instant and location. Tithi/Yoga/Karana use the Moon-Sun elongation, so
 * they are identical whether sidereal or tropical longitudes are supplied.
 */
export function computePanchang(
  sunSidereal: number,
  moonSidereal: number,
  moonNakshatra: number,
  utc: Date,
  latitude: number,
  longitude: number,
  varaIndex: number,
): Panchang {
  const elongation = norm360(moonSidereal - sunSidereal);

  // Tithi: 12° each, 30 per lunar month.
  const tithiIdx = Math.floor(elongation / 12); // 0..29
  const paksha = tithiIdx < 15 ? "Shukla" : "Krishna";
  const tithiName = TITHI_NAMES[tithiIdx % 15];

  // Yoga: sum of longitudes / (360/27).
  const yogaIdx = Math.floor(norm360(sunSidereal + moonSidereal) / (360 / 27)) % 27;

  // Karana: 6° each, 60 per lunar month.
  const karanaIdx = Math.floor(elongation / 6); // 0..59

  // Sunrise / sunset for the birth date at the location.
  let sunrise: Date | null = null;
  let sunset: Date | null = null;
  try {
    const observer = new Astronomy.Observer(latitude, longitude, 0);
    const dayStart = new Date(
      Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate(), 0, 0, 0),
    );
    const rise = Astronomy.SearchRiseSet(
      Astronomy.Body.Sun,
      observer,
      +1,
      Astronomy.MakeTime(dayStart),
      1,
    );
    const set = Astronomy.SearchRiseSet(
      Astronomy.Body.Sun,
      observer,
      -1,
      Astronomy.MakeTime(dayStart),
      1,
    );
    sunrise = rise ? rise.date : null;
    sunset = set ? set.date : null;
  } catch {
    // Polar day/night or engine edge cases — leave null.
  }

  return {
    vara: VARAS[((varaIndex % 7) + 7) % 7],
    tithi: {
      index: tithiIdx + 1,
      name: tithiName,
      paksha,
    },
    nakshatra: { index: moonNakshatra, name: NAKSHATRA_NAMES[moonNakshatra] },
    yoga: { index: yogaIdx, name: YOGA_NAMES[yogaIdx] },
    karana: { index: karanaIdx, name: karanaName(karanaIdx) },
    sunrise,
    sunset,
    moonPhase: elongation,
  };
}
