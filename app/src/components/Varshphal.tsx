import { useMemo } from "react";
import type { DetailedKundli } from "../astro/kundli";
import { computeVarshphal } from "../astro/varshphal";
import type { VarshphalChart } from "../astro/varshphal";
import type { SignCell } from "./chartLayout";
import NorthIndianChart from "./NorthIndianChart";
import SouthIndianChart from "./SouthIndianChart";
import EastIndianChart from "./EastIndianChart";
import { PLANET_GLYPH, SIGNS } from "../astro/constants";

type Style = "north" | "south" | "east";

interface Props {
  result: DetailedKundli;
  style: Style;
}

function buildCells(chart: VarshphalChart): SignCell[] {
  const ascSign = chart.ascendant.sign;
  const cells: SignCell[] = Array.from({ length: 12 }, (_, sign) => ({
    sign,
    house: ((sign - ascSign + 12) % 12) + 1,
    isLagna: sign === ascSign,
    planets: [],
  }));
  for (const p of chart.planets) {
    cells[p.sign].planets.push({ id: p.id, retrograde: p.retrograde });
  }
  return cells;
}

function fmtDate(d: Date): string {
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function varshphalAnchorId(year: number): string {
  return `varsha-${year}`;
}

function VarshphalYear({
  result,
  style,
  year,
}: {
  result: DetailedKundli;
  style: Style;
  year: number;
}) {
  const birthUtc = result.utcDate;
  const moonLon = result.planets.find((p) => p.id === "Moon")!.longitude;
  const birthYear = birthUtc.getUTCFullYear();
  const age = year - birthYear;

  const chart = useMemo(
    () =>
      computeVarshphal(
        birthUtc,
        result.natalSunSidereal,
        result.ascendant.sign,
        moonLon,
        result.input.latitude,
        result.input.longitude,
        age,
      ),
    [birthUtc, result, moonLon, age],
  );

  const cells = buildCells(chart);
  const title = `Varsha Pravesh · ${year} (Age ${age})`;

  const renderChart =
    style === "north" ? (
      <NorthIndianChart cells={cells} title={title} />
    ) : style === "south" ? (
      <SouthIndianChart cells={cells} title={title} />
    ) : (
      <EastIndianChart cells={cells} title={title} />
    );

  return (
    <div className="varsha-year" id={varshphalAnchorId(year)}>
      <h4 className="varsha-year-title">
        {year} · Age {age}
      </h4>

      <p className="varsha-pravesh">
        <strong>Varsha Pravesh:</strong> {fmtDate(chart.pravesh)} (UTC)
      </p>

      <div className="varsha-key">
        <div className="vk-item">
          <span className="pc-label">Varsha Lagna</span>
          <span className="pc-value">{SIGNS[chart.ascendant.sign]}</span>
        </div>
        <div className="vk-item">
          <span className="pc-label">Muntha</span>
          <span className="pc-value">
            {SIGNS[chart.muntha.sign]} (house {chart.muntha.house})
          </span>
        </div>
        <div className="vk-item">
          <span className="pc-label">Year Lord (Varshesha)</span>
          <span className="pc-value">{chart.yearLord}</span>
        </div>
      </div>

      <div className="single-chart">{renderChart}</div>

      <h5 className="varsha-mudda-title">Mudda Dasha (annual)</h5>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Lord</th>
              <th>Start</th>
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            {chart.muddaDasha.map((d) => (
              <tr key={d.lord}>
                <td>
                  <span className="glyph">{PLANET_GLYPH[d.lord]}</span> {d.lord}
                </td>
                <td>{d.start.toLocaleDateString()}</td>
                <td>{d.end.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function varshphalYears(result: DetailedKundli): number[] {
  const birthYear = result.utcDate.getUTCFullYear();
  const thisYear = new Date().getFullYear();
  const start = Math.max(
    birthYear,
    result.input.varshphalStartYear ?? thisYear,
  );
  const end = Math.max(start, result.input.varshphalEndYear ?? start);
  const capped = Math.min(end, start + 49); // safety cap of 50 years
  const years: number[] = [];
  for (let y = start; y <= capped; y++) years.push(y);
  return years;
}

export default function Varshphal({ result, style }: Props) {
  const years = varshphalYears(result);

  return (
    <div className="panel">
      <h3>Varshphal (Annual Horoscope · Tajika)</h3>
      <p className="muted">
        Solar-return charts cast when the Sun returns to its natal position, for
        each year in the chosen range ({years[0]}–{years[years.length - 1]}).
        Change the range in the birth details form.
      </p>

      {years.map((y) => (
        <VarshphalYear key={y} result={result} style={style} year={y} />
      ))}

      <p className="disclaimer">
        Muntha advances one sign per year from the natal Lagna. The year lord and
        Mudda dasha are simplified Tajika indicators for guidance.
      </p>
    </div>
  );
}
