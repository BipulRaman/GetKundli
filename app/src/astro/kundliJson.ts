import type { DetailedKundli } from "./kundli";
import type { PlanetId } from "./types";
import {
  NAKSHATRAS,
  NAKSHATRA_LORD,
  PLANET_GLYPH,
  PLANET_SHORT,
  SIGNS,
  SIGN_SHORT,
} from "./constants";
import { SIGN_LORD } from "./dignity";
import { VARGAS } from "./vargas";
import { computeVarshphal, type VarshphalChart } from "./varshphal";
import { chartSvg, type ChartStyle } from "./chartSvg";
import {
  DASHA_THEMES,
  HOUSE_MEANINGS,
  PLANET_SIGNIFICATIONS,
  SIGN_TRAITS,
} from "../data/interpretations";
import {
  buildNavamsaCells,
  buildSignCells,
  buildVargaCells,
  type SignCell,
} from "./chartLayout";

/**
 * A flat, fully-serializable "view model" of a kundli. Everything a template
 * needs is pre-computed here (formatted strings, pre-rendered chart SVGs,
 * ordered lists) so the Liquid template stays pure presentation with no
 * astrology logic. This object is what gets handed to the renderer and is also
 * what we expose as the downloadable JSON.
 */
export interface KundliJson {
  meta: {
    name: string;
    place: string;
    date: string;
    time: string;
    latitude: number;
    longitude: number;
    timeZone: string;
    ayanamsa: string;
    style: ChartStyle;
    generatedAt: string;
  };
  ascendant: {
    sign: string;
    signShort: string;
    degree: string;
    nakshatra: string;
    pada: number;
  };
  /** Pre-rendered SVG charts for the Overview. */
  overview: {
    rashi: ChartSvg;
    navamsa: ChartSvg;
  };
  planets: PlanetRow[];
  panchang: {
    vara: string;
    tithi: string;
    paksha: string;
    nakshatra: string;
    yoga: string;
    karana: string;
    sunrise: string;
    sunset: string;
    moonPhase: string;
  };
  shadbala: {
    order: string;
    components: { key: string; label: string }[];
    rows: ShadbalaRow[];
  };
  vargas: VargaChart[];
  dasha: {
    current: string;
    periods: DashaRow[];
  };
  ashtakavarga: {
    total: number;
    heads: string[];
    rows: AshtakavargaRow[];
  };
  yogas: { name: string; description: string }[];
  doshas: {
    name: string;
    present: boolean;
    statusLabel: string;
    statusTone: "good" | "bad";
    detail: string;
  }[];
  varshphal: {
    range: string;
    years: VarshphalYearView[];
  };
  interpretation: Interpretation;
}

export interface ChartSvg {
  title: string;
  svg: string;
}

export interface VargaChart extends ChartSvg {
  id: string;
  anchor: string;
  description: string;
}

export interface PlanetRow {
  id: PlanetId;
  glyph: string;
  short: string;
  sign: string;
  signShort: string;
  degree: string;
  house: number;
  nakshatra: string;
  pada: number;
  signLord: PlanetId;
  nakLord: PlanetId;
  dignity: string;
  retrograde: boolean;
  combust: boolean;
  state: string;
}

export interface DashaRow {
  lord: PlanetId;
  glyph: string;
  start: string;
  end: string;
  active: boolean;
  anchor: string;
  antars: {
    lord: PlanetId;
    start: string;
    end: string;
    active: boolean;
    last: boolean;
  }[];
}

export interface ShadbalaRow {
  id: PlanetId;
  glyph: string;
  sthana: string;
  dig: string;
  kala: string;
  cheshta: string;
  naisargika: string;
  drik: string;
  total: string;
  required: string;
  ratio: string;
  strong: boolean;
  strengthLabel: string;
  strengthTone: "good" | "bad";
  rank: number;
}

export interface AshtakavargaRow {
  sign: string;
  signShort: string;
  house: number;
  isAsc: boolean;
  bav: number[];
  sav: number;
  strong: boolean;
  weak: boolean;
  savTone: "good" | "bad" | "";
}

export interface VarshphalYearView {
  year: number;
  age: number;
  anchor: string;
  pravesh: string;
  lagna: string;
  muntha: string;
  yearLord: PlanetId;
  chart: ChartSvg;
  mudda: { lord: PlanetId; glyph: string; start: string; end: string }[];
}

export interface Interpretation {
  lagnaSign: string;
  lagnaText: string;
  moonSign: string;
  moonText: string;
  moonNak: string;
  moonPada: number;
  sunSign: string;
  sunText: string;
  planets: {
    id: PlanetId;
    house: number;
    sign: string;
    signification: string;
    houseMeaning: string;
  }[];
  current: { maha: PlanetId; antar: PlanetId; mahaText: string; antarText: string } | null;
}

const SHADBALA_COMPONENTS: { key: keyof BalaVals; label: string }[] = [
  { key: "sthana", label: "Sthana" },
  { key: "dig", label: "Dig" },
  { key: "kala", label: "Kala" },
  { key: "cheshta", label: "Cheshta" },
  { key: "naisargika", label: "Naisargika" },
  { key: "drik", label: "Drik" },
];

interface BalaVals {
  sthana: number;
  dig: number;
  kala: number;
  cheshta: number;
  naisargika: number;
  drik: number;
}

const AV_PLANETS: PlanetId[] = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
];

function dms(deg: number): string {
  const d = Math.floor(deg);
  const mFloat = (deg - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${d}° ${String(m).padStart(2, "0")}′ ${String(s).padStart(2, "0")}″`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtDateTime(d: Date): string {
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtTime(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function varshphalYears(result: DetailedKundli): number[] {
  const birthYear = result.utcDate.getUTCFullYear();
  const thisYear = new Date().getFullYear();
  const start = Math.max(birthYear, result.input.varshphalStartYear ?? thisYear);
  const end = Math.max(start, result.input.varshphalEndYear ?? start);
  const capped = Math.min(end, start + 49);
  const years: number[] = [];
  for (let y = start; y <= capped; y++) years.push(y);
  return years;
}

function varshphalCells(chart: VarshphalChart): SignCell[] {
  const ascSign = chart.ascendant.sign;
  const cells: SignCell[] = Array.from({ length: 12 }, (_, sign) => ({
    sign,
    house: ((sign - ascSign + 12) % 12) + 1,
    isLagna: sign === ascSign,
    planets: [],
  }));
  for (const p of chart.planets) {
    cells[p.sign].planets.push({
      id: p.id,
      retrograde: p.retrograde,
      degree: p.degreeInSign,
    });
  }
  return cells;
}

/** Build the flat JSON view model used by the template and JSON export. */
export function buildKundliJson(
  result: DetailedKundli,
  style: ChartStyle = "north",
): KundliJson {
  const input = result.input;

  const planets: PlanetRow[] = result.planets.map((p) => {
    const dig = result.dignities[p.id];
    const states: string[] = [];
    if (p.retrograde) states.push("Retro");
    if (dig.combust) states.push("Combust");
    return {
      id: p.id,
      glyph: PLANET_GLYPH[p.id],
      short: PLANET_SHORT[p.id],
      sign: SIGNS[p.sign],
      signShort: SIGN_SHORT[p.sign],
      degree: dms(p.degreeInSign),
      house: p.house,
      nakshatra: NAKSHATRAS[p.nakshatra],
      pada: p.pada,
      signLord: SIGN_LORD[p.sign],
      nakLord: NAKSHATRA_LORD[p.nakshatra],
      dignity: dig.dignity,
      retrograde: p.retrograde,
      combust: dig.combust,
      state: states.length ? states.join(", ") : "Direct",
    };
  });

  // ---- Shadbala ----
  const sb = result.shadbala;
  const shadbalaRows: ShadbalaRow[] = sb.order.map((id) => {
    const b = sb.planets[id];
    return {
      id,
      glyph: PLANET_GLYPH[id],
      sthana: b.sthana.toFixed(2),
      dig: b.dig.toFixed(2),
      kala: b.kala.toFixed(2),
      cheshta: b.cheshta.toFixed(2),
      naisargika: b.naisargika.toFixed(2),
      drik: b.drik.toFixed(2),
      total: b.total.toFixed(2),
      required: b.required.toFixed(2),
      ratio: `${b.ratio.toFixed(2)}×`,
      strong: b.ratio >= 1,
      strengthLabel: b.ratio >= 1 ? "Strong" : "Weak",
      strengthTone: b.ratio >= 1 ? "good" : "bad",
      rank: b.rank,
    };
  });

  // ---- Divisional charts ----
  const vargas: VargaChart[] = VARGAS.map((v) => ({
    id: v.id,
    anchor: `varga-${v.id}`,
    title: `${v.id} · ${v.name}`,
    description: v.description,
    svg: chartSvg(buildVargaCells(result, v.factor), style),
  }));

  // ---- Dashas (maha + antar) ----
  const current = result.currentDasha;
  const dashaPeriods: DashaRow[] = result.dashas.map((m) => {
    const active = current?.maha === m.lord;
    const antars = (m.children ?? []).map((a, ai, arr) => ({
      lord: a.lord,
      start: fmtDate(a.start),
      end: fmtDate(a.end),
      active: active && current?.antar === a.lord,
      last: ai === arr.length - 1,
    }));
    return {
      lord: m.lord,
      glyph: PLANET_GLYPH[m.lord],
      start: fmtDate(m.start),
      end: fmtDate(m.end),
      active,
      anchor: `dasha-${m.lord}-${m.start.getTime()}`,
      antars,
    };
  });
  const currentStr = current
    ? `${current.maha} Mahadasha · ${current.antar} Antardasha${
        current.pratyantar ? ` · ${current.pratyantar} Pratyantardasha` : ""
      }`
    : "—";

  // ---- Ashtakavarga ----
  const { bav, sav } = result.ashtakavarga;
  const ascSign = result.ascendant.sign;
  const avTotal = sav.reduce((a, b) => a + b, 0);
  const avRows: AshtakavargaRow[] = SIGNS.map((sign, i) => {
    const savVal = sav[i];
    return {
      sign,
      signShort: SIGN_SHORT[i],
      house: ((i - ascSign + 12) % 12) + 1,
      isAsc: i === ascSign,
      bav: AV_PLANETS.map((p) => bav[p][i]),
      sav: savVal,
      strong: savVal >= 30,
      weak: savVal <= 25,
      savTone: savVal >= 30 ? "good" : savVal <= 25 ? "bad" : "",
    };
  });

  // ---- Varshphal ----
  const moonLon = result.planets.find((p) => p.id === "Moon")!.longitude;
  const birthYear = result.utcDate.getUTCFullYear();
  const years = varshphalYears(result);
  const varshphalViews: VarshphalYearView[] = years.map((year) => {
    const age = year - birthYear;
    const chart = computeVarshphal(
      result.utcDate,
      result.natalSunSidereal,
      result.ascendant.sign,
      moonLon,
      input.latitude,
      input.longitude,
      age,
    );
    return {
      year,
      age,
      anchor: `varsha-${year}`,
      pravesh: `${fmtDateTime(chart.pravesh)} (UTC)`,
      lagna: SIGNS[chart.ascendant.sign],
      muntha: `${SIGNS[chart.muntha.sign]} (house ${chart.muntha.house})`,
      yearLord: chart.yearLord,
      chart: {
        title: `Varsha Pravesh · ${year} (Age ${age})`,
        svg: chartSvg(varshphalCells(chart), style),
      },
      mudda: chart.muddaDasha.map((d) => ({
        lord: d.lord,
        glyph: PLANET_GLYPH[d.lord],
        start: d.start.toLocaleDateString(),
        end: d.end.toLocaleDateString(),
      })),
    };
  });

  // ---- Interpretation ----
  const asc = result.ascendant;
  const moon = result.planets.find((p) => p.id === "Moon")!;
  const sun = result.planets.find((p) => p.id === "Sun")!;
  const interpretation: Interpretation = {
    lagnaSign: SIGNS[asc.sign],
    lagnaText: SIGN_TRAITS[asc.sign],
    moonSign: SIGNS[moon.sign],
    moonText: SIGN_TRAITS[moon.sign],
    moonNak: NAKSHATRAS[moon.nakshatra],
    moonPada: moon.pada,
    sunSign: SIGNS[sun.sign],
    sunText: SIGN_TRAITS[sun.sign],
    planets: result.planets.map((p) => ({
      id: p.id,
      house: p.house,
      sign: SIGNS[p.sign],
      signification: PLANET_SIGNIFICATIONS[p.id],
      houseMeaning: HOUSE_MEANINGS[p.house - 1],
    })),
    current: current
      ? {
          maha: current.maha,
          antar: current.antar,
          mahaText: DASHA_THEMES[current.maha],
          antarText: DASHA_THEMES[current.antar],
        }
      : null,
  };

  return {
    meta: {
      name: input.name?.trim() || "—",
      place: input.place?.trim() || "—",
      date: `${String(input.day).padStart(2, "0")}/${String(input.month).padStart(2, "0")}/${input.year}`,
      time: `${String(input.hour).padStart(2, "0")}:${String(input.minute).padStart(2, "0")}`,
      latitude: input.latitude,
      longitude: input.longitude,
      timeZone: input.timeZone || `UTC${input.tzOffsetHours >= 0 ? "+" : ""}${input.tzOffsetHours}`,
      ayanamsa: dms(result.ayanamsa),
      style,
      generatedAt: new Date().toLocaleString(),
    },
    ascendant: {
      sign: SIGNS[result.ascendant.sign],
      signShort: SIGN_SHORT[result.ascendant.sign],
      degree: dms(result.ascendant.degreeInSign),
      nakshatra: NAKSHATRAS[result.ascendant.nakshatra],
      pada: result.ascendant.pada,
    },
    overview: {
      rashi: { title: "Rashi (D1)", svg: chartSvg(buildSignCells(result), style) },
      navamsa: { title: "Navamsa (D9)", svg: chartSvg(buildNavamsaCells(result), style) },
    },
    planets,
    panchang: {
      vara: result.panchang.vara,
      tithi: result.panchang.tithi.name,
      paksha: result.panchang.tithi.paksha,
      nakshatra: result.panchang.nakshatra.name,
      yoga: result.panchang.yoga.name,
      karana: result.panchang.karana.name,
      sunrise: fmtTime(result.panchang.sunrise),
      sunset: fmtTime(result.panchang.sunset),
      moonPhase: `${result.panchang.moonPhase.toFixed(1)}° elongation`,
    },
    shadbala: {
      order: sb.order.join(" · "),
      components: SHADBALA_COMPONENTS.map((c) => ({ key: c.key, label: c.label })),
      rows: shadbalaRows,
    },
    vargas,
    dasha: { current: currentStr, periods: dashaPeriods },
    ashtakavarga: {
      total: avTotal,
      heads: AV_PLANETS.map((p) => PLANET_SHORT[p]),
      rows: avRows,
    },
    yogas: result.yogas.map((y) => ({ name: y.name, description: y.description })),
    doshas: result.doshas.map((d) => ({
      name: d.name,
      present: d.present,
      statusLabel: d.present ? "Present" : "Absent",
      statusTone: d.present ? "bad" : "good",
      detail: d.detail,
    })),
    varshphal: {
      range: years.length ? `${years[0]}–${years[years.length - 1]}` : "—",
      years: varshphalViews,
    },
    interpretation,
  };
}
