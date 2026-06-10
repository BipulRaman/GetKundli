import type { DetailedKundli } from "../astro/kundli";
import { PLANET_GLYPH } from "../astro/constants";
import { SHADBALA_PLANETS } from "../astro/shadbala";

interface Props {
  result: DetailedKundli;
}

const COMPONENTS: { key: keyof RowVals; label: string }[] = [
  { key: "sthana", label: "Sthana" },
  { key: "dig", label: "Dig" },
  { key: "kala", label: "Kala" },
  { key: "cheshta", label: "Cheshta" },
  { key: "naisargika", label: "Naisargika" },
  { key: "drik", label: "Drik" },
];

interface RowVals {
  sthana: number;
  dig: number;
  kala: number;
  cheshta: number;
  naisargika: number;
  drik: number;
}

function r(n: number): string {
  return n.toFixed(2);
}

export default function Shadbala({ result }: Props) {
  const sb = result.shadbala;
  return (
    <div className="panel">
      <h3>Shadbala — Six-fold Strength (Rupas)</h3>
      <div className="table-scroll">
        <table className="data-table compact">
          <thead>
            <tr>
              <th>Planet</th>
              {COMPONENTS.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th>Total</th>
              <th>Required</th>
              <th>Ratio</th>
              <th>Strength</th>
            </tr>
          </thead>
          <tbody>
            {SHADBALA_PLANETS.map((id) => {
              const b = sb.planets[id];
              const strong = b.ratio >= 1;
              return (
                <tr key={id}>
                  <td>
                    <span className="glyph">{PLANET_GLYPH[id]}</span> {id}
                  </td>
                  {COMPONENTS.map((c) => (
                    <td key={c.key}>{r(b[c.key])}</td>
                  ))}
                  <td>
                    <strong>{r(b.total)}</strong>
                  </td>
                  <td>{r(b.required)}</td>
                  <td>{b.ratio.toFixed(2)}×</td>
                  <td>
                    <span className={strong ? "dig-good" : "dig-bad"}>
                      {strong ? "Strong" : "Weak"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted">
        Strongest to weakest:{" "}
        {sb.order.map((id, i) => (
          <span key={id}>
            {i > 0 && " · "}
            {id} ({sb.planets[id].total.toFixed(2)})
          </span>
        ))}
      </p>
      <p className="muted">
        1 Rupa = 60 Virupas. A planet is considered strong when its total meets
        the required minimum (Ratio ≥ 1×). Saptavargaja, Cheshta and the
        Abda/Masa Kala-balas use simplified classical approximations.
      </p>
    </div>
  );
}
