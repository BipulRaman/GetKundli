// Core domain types for the Kundli engine.

export type PlanetId =
  | "Sun"
  | "Moon"
  | "Mars"
  | "Mercury"
  | "Jupiter"
  | "Venus"
  | "Saturn"
  | "Rahu"
  | "Ketu";

export interface BirthInput {
  /** Local calendar date/time as entered by the user. */
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second: number;
  /** Geographic coordinates (decimal degrees, East/North positive). */
  latitude: number;
  longitude: number;
  /**
   * IANA time zone name (e.g. "Asia/Kolkata"). When set, the exact UTC offset
   * for the birth date — including DST and historical rules — is derived from it.
   */
  timeZone?: string;
  /** Explicit UTC offset in hours (fallback when no time zone is given). */
  tzOffsetHours: number;
  name?: string;
  place?: string;
}

export interface PlanetPosition {
  id: PlanetId;
  /** Sidereal ecliptic longitude in degrees [0,360). */
  longitude: number;
  /** Zodiac sign index 0-11 (0 = Aries). */
  sign: number;
  /** Degrees within the sign [0,30). */
  degreeInSign: number;
  /** Nakshatra index 0-26. */
  nakshatra: number;
  /** Pada (quarter) 1-4. */
  pada: number;
  /** Whole-sign house number 1-12 relative to the ascendant. */
  house: number;
  /** True if the planet is retrograde. */
  retrograde: boolean;
}

export interface Ascendant {
  longitude: number; // sidereal
  sign: number;
  degreeInSign: number;
  nakshatra: number;
  pada: number;
}

export interface DashaPeriod {
  lord: PlanetId;
  start: Date;
  end: Date;
  children?: DashaPeriod[];
}

export interface KundliResult {
  input: BirthInput;
  utcDate: Date;
  ayanamsa: number;
  ascendant: Ascendant;
  planets: PlanetPosition[];
  /** Navamsa (D9) sign for ascendant + each planet. */
  navamsa: {
    ascendant: number;
    planets: Record<PlanetId, number>;
  };
  dashas: DashaPeriod[];
  currentDasha: { maha: PlanetId; antar: PlanetId; pratyantar?: PlanetId } | null;
}
