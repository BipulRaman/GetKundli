import { Fragment } from "react";
import type { DashaPeriod, KundliResult } from "../astro/types";
import { PLANET_GLYPH } from "../astro/constants";

interface Props {
  result: KundliResult;
}

function fmt(d: Date): string {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function dashaAnchorId(maha: DashaPeriod): string {
  return `dasha-${maha.lord}-${maha.start.getTime()}`;
}

export default function DashaTable({ result }: Props) {
  const current = result.currentDasha;

  return (
    <div className="panel">
      <h3>Vimshottari Dasha</h3>
      {current && (
        <p className="current-dasha">
          Running: <strong>{current.maha}</strong> Mahadasha ·{" "}
          <strong>{current.antar}</strong> Antardasha
          {current.pratyantar && (
            <>
              {" "}
              · <strong>{current.pratyantar}</strong> Pratyantardasha
            </>
          )}
        </p>
      )}
      <table className="data-table">
        <thead>
          <tr>
            <th>Period</th>
            <th>Start</th>
            <th>End</th>
          </tr>
        </thead>
        <tbody>
          {result.dashas.map((maha: DashaPeriod) => {
            const active = current?.maha === maha.lord;
            return (
              <Fragment key={dashaAnchorId(maha)}>
                <tr
                  id={dashaAnchorId(maha)}
                  className={`maha-row${active ? " active" : ""}`}
                >
                  <td>
                    <span className="glyph">{PLANET_GLYPH[maha.lord]}</span>{" "}
                    {maha.lord} Mahadasha
                  </td>
                  <td>{fmt(maha.start)}</td>
                  <td>{fmt(maha.end)}</td>
                </tr>
                {maha.children?.map((antar, ai) => {
                  const antarActive = active && current?.antar === antar.lord;
                  const isLast = ai === (maha.children?.length ?? 0) - 1;
                  return (
                    <tr
                      key={`${antar.lord}-${antar.start.getTime()}`}
                      className={`antar-row${antarActive ? " active" : ""}`}
                    >
                      <td className="tree-cell">
                        <span className={`tree-branch${isLast ? " last" : ""}`} />
                        {antar.lord}
                      </td>
                      <td>{fmt(antar.start)}</td>
                      <td>{fmt(antar.end)}</td>
                    </tr>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
