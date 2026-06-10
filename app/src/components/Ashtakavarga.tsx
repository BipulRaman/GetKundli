import type { DetailedKundli } from "../astro/kundli";
import { PLANET_SHORT, SIGN_SHORT, SIGNS } from "../astro/constants";
import type { PlanetId } from "../astro/types";

interface Props {
  result: DetailedKundli;
}

const PLANETS7: PlanetId[] = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
];

export default function Ashtakavarga({ result }: Props) {
  const { bav, sav } = result.ashtakavarga;
  const ascSign = result.ascendant.sign;
  const total = sav.reduce((a, b) => a + b, 0);

  return (
    <div className="panel">
      <h3>Ashtakavarga</h3>
      <p className="muted">
        Benefic bindus per sign. Signs with higher Sarvashtakavarga (SAV) totals
        give better results for transits and dashas. Total = {total} (classical
        337).
      </p>
      <div className="table-scroll">
        <table className="data-table av-table">
          <thead>
            <tr>
              <th>Sign</th>
              <th>House</th>
              {PLANETS7.map((p) => (
                <th key={p}>{PLANET_SHORT[p]}</th>
              ))}
              <th className="sav-col">SAV</th>
            </tr>
          </thead>
          <tbody>
            {SIGNS.map((sign, i) => {
              const house = ((i - ascSign + 12) % 12) + 1;
              const savVal = sav[i];
              const strong = savVal >= 30;
              const weak = savVal <= 25;
              return (
                <tr key={sign} className={i === ascSign ? "asc-row" : ""}>
                  <td>
                    {SIGN_SHORT[i]} {sign}
                  </td>
                  <td>{house}</td>
                  {PLANETS7.map((p) => (
                    <td key={p}>{bav[p][i]}</td>
                  ))}
                  <td
                    className={`sav-col ${
                      strong ? "sav-strong" : weak ? "sav-weak" : ""
                    }`}
                  >
                    {savVal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
