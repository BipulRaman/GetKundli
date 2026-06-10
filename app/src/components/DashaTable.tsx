import { Fragment, useState } from "react";
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

export default function DashaTable({ result }: Props) {
  const [openMaha, setOpenMaha] = useState<string | null>(null);
  const [openAntar, setOpenAntar] = useState<string | null>(null);
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {result.dashas.map((maha: DashaPeriod) => {
            const mahaKey = `${maha.lord}-${maha.start.getTime()}`;
            const active = current?.maha === maha.lord;
            const mahaOpen = openMaha === mahaKey;
            return (
              <Fragment key={mahaKey}>
                <tr
                  className={`maha-row${active ? " active" : ""}`}
                  onClick={() => setOpenMaha(mahaOpen ? null : mahaKey)}
                >
                  <td>
                    <span className="glyph">{PLANET_GLYPH[maha.lord]}</span>{" "}
                    {maha.lord}
                  </td>
                  <td>{fmt(maha.start)}</td>
                  <td>{fmt(maha.end)}</td>
                  <td className="expand">{mahaOpen ? "▾" : "▸"}</td>
                </tr>
                {mahaOpen &&
                  maha.children?.map((antar) => {
                    const antarKey = `${mahaKey}-${antar.lord}-${antar.start.getTime()}`;
                    const antarActive =
                      active && current?.antar === antar.lord;
                    const antarOpen = openAntar === antarKey;
                    return (
                      <Fragment key={antarKey}>
                        <tr
                          className={`antar-row${antarActive ? " active" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenAntar(antarOpen ? null : antarKey);
                          }}
                        >
                          <td className="indent">↳ {antar.lord}</td>
                          <td>{fmt(antar.start)}</td>
                          <td>{fmt(antar.end)}</td>
                          <td className="expand">
                            {antar.children?.length
                              ? antarOpen
                                ? "▾"
                                : "▸"
                              : ""}
                          </td>
                        </tr>
                        {antarOpen &&
                          antar.children?.map((prat) => (
                            <tr
                              key={`${antarKey}-${prat.lord}-${prat.start.getTime()}`}
                              className={`prat-row${
                                antarActive && current?.pratyantar === prat.lord
                                  ? " active"
                                  : ""
                              }`}
                            >
                              <td className="indent2">↳↳ {prat.lord}</td>
                              <td>{fmt(prat.start)}</td>
                              <td>{fmt(prat.end)}</td>
                              <td></td>
                            </tr>
                          ))}
                      </Fragment>
                    );
                  })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      <p className="muted">
        Tap a Mahadasha to see Antardashas, then an Antardasha for Pratyantardashas.
      </p>
    </div>
  );
}
