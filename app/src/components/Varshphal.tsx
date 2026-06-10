import { useMemo, useState } from "react";
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

export default function Varshphal({ result, style }: Props) {
  const birthUtc = result.utcDate;
  const moonLon = result.planets.find((p) => p.id === "Moon")!.longitude;

  const birthYear = birthUtc.getUTCFullYear();
  const currentAge = useMemo(() => {
    const ms = Date.now() - birthUtc.getTime();
    return Math.max(0, Math.floor(ms / (365.25 * 24 * 3600 * 1000)));
  }, [birthUtc]);
  const currentYear = birthYear + currentAge;

  const [year, setYear] = useState(currentYear);
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

  function renderChart() {
    if (style === "north") return <NorthIndianChart cells={cells} title={title} />;
    if (style === "south") return <SouthIndianChart cells={cells} title={title} />;
    return <EastIndianChart cells={cells} title={title} />;
  }

  return (
    <div className="panel">
      <h3>Varshphal (Annual Horoscope · Tajika)</h3>
      <p className="muted">
        The solar-return chart cast when the Sun returns to its natal position for
        the chosen year.
      </p>

      <div className="varsha-controls">
        <button onClick={() => setYear((y) => Math.max(birthYear, y - 1))}>−</button>
        <label>
          Year
          <input
            type="number"
            min={birthYear}
            max={birthYear + 120}
            value={year}
            onChange={(e) =>
              setYear(
                Math.max(birthYear, Number(e.target.value) || birthYear),
              )
            }
          />
        </label>
        <button onClick={() => setYear((y) => y + 1)}>+</button>
        <button className="link" onClick={() => setYear(currentYear)}>
          Current year ({currentYear})
        </button>
      </div>

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

      <div className="single-chart">{renderChart()}</div>

      <h4>Mudda Dasha (annual)</h4>
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
      <p className="disclaimer">
        Muntha advances one sign per year from the natal Lagna. The year lord and
        Mudda dasha are simplified Tajika indicators for guidance.
      </p>
    </div>
  );
}
