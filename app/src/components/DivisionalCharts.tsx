import { useMemo, useState } from "react";
import type { DetailedKundli } from "../astro/kundli";
import { VARGAS } from "../astro/vargas";
import { buildVargaCells } from "./chartLayout";
import NorthIndianChart from "./NorthIndianChart";
import SouthIndianChart from "./SouthIndianChart";
import EastIndianChart from "./EastIndianChart";

type Style = "north" | "south" | "east";

interface Props {
  result: DetailedKundli;
  style: Style;
}

export default function DivisionalCharts({ result, style }: Props) {
  const [vargaId, setVargaId] = useState("D1");
  const varga = VARGAS.find((v) => v.id === vargaId) ?? VARGAS[0];

  const cells = useMemo(
    () => buildVargaCells(result, varga.factor),
    [result, varga.factor],
  );

  const title = `${varga.id} · ${varga.name}`;

  function chart() {
    if (style === "north") return <NorthIndianChart cells={cells} title={title} />;
    if (style === "south") return <SouthIndianChart cells={cells} title={title} />;
    return <EastIndianChart cells={cells} title={title} />;
  }

  return (
    <div className="panel">
      <h3>Divisional Charts (Shodashavarga)</h3>
      <p className="muted">
        Sixteen divisional charts (vargas) refine each life area beyond the Rashi
        chart.
      </p>
      <div className="varga-tabs">
        {VARGAS.map((v) => (
          <button
            key={v.id}
            className={v.id === vargaId ? "varga-tab active" : "varga-tab"}
            onClick={() => setVargaId(v.id)}
            title={v.description}
          >
            {v.id}
          </button>
        ))}
      </div>
      <p className="varga-desc">
        <strong>
          {varga.id} · {varga.name}
        </strong>{" "}
        — {varga.description}
      </p>
      <div className="single-chart">{chart()}</div>
    </div>
  );
}
