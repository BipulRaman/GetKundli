import type { DetailedKundli } from "../astro/kundli";
import { NAKSHATRAS, PLANET_GLYPH, SIGNS } from "../astro/constants";
import { NAKSHATRA_LORD } from "../astro/constants";

interface Props {
  result: DetailedKundli;
}

function dms(deg: number): string {
  const d = Math.floor(deg);
  const mFloat = (deg - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${d}° ${String(m).padStart(2, "0")}′ ${String(s).padStart(2, "0")}″`;
}

const DIGNITY_CLASS: Record<string, string> = {
  Exalted: "dig-good",
  Moolatrikona: "dig-good",
  "Own sign": "dig-good",
  Friend: "dig-ok",
  Neutral: "dig-neutral",
  Enemy: "dig-bad",
  Debilitated: "dig-bad",
};

export default function PlanetTable({ result }: Props) {
  return (
    <div className="panel">
      <h3>Planetary Positions (Sidereal · Lahiri)</h3>
      <div className="table-scroll">
        <table className="data-table compact">
          <thead>
            <tr>
              <th>Planet</th>
              <th>Sign</th>
              <th>Degree</th>
              <th>House</th>
              <th>Nakshatra</th>
              <th>Pada</th>
              <th>Sign Lord</th>
              <th>Nak. Lord</th>
              <th>Dignity</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            <tr className="asc-row">
              <td>Lagna</td>
              <td>{SIGNS[result.ascendant.sign]}</td>
              <td>{dms(result.ascendant.degreeInSign)}</td>
              <td>1</td>
              <td>{NAKSHATRAS[result.ascendant.nakshatra]}</td>
              <td>{result.ascendant.pada}</td>
              <td>—</td>
              <td>—</td>
              <td>—</td>
              <td>—</td>
            </tr>
            {result.planets.map((p) => {
              const dig = result.dignities[p.id];
              const states: string[] = [];
              if (p.retrograde) states.push("Retro");
              if (dig.combust) states.push("Combust");
              return (
                <tr key={p.id}>
                  <td>
                    <span className="glyph">{PLANET_GLYPH[p.id]}</span> {p.id}
                  </td>
                  <td>{SIGNS[p.sign]}</td>
                  <td>{dms(p.degreeInSign)}</td>
                  <td>{p.house}</td>
                  <td>{NAKSHATRAS[p.nakshatra]}</td>
                  <td>{p.pada}</td>
                  <td>{dig.signLord}</td>
                  <td>{NAKSHATRA_LORD[p.nakshatra]}</td>
                  <td>
                    <span className={DIGNITY_CLASS[dig.dignity] ?? "dig-neutral"}>
                      {dig.dignity}
                    </span>
                  </td>
                  <td>{states.length ? states.join(", ") : "Direct"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted">
        Ayanamsa: {dms(result.ayanamsa)} · UTC: {result.utcDate.toUTCString()}
      </p>
    </div>
  );
}
