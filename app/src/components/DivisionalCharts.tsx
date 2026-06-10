import { useMemo } from "react";
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

export function vargaAnchorId(id: string): string {
  return `varga-${id}`;
}

function VargaCard({
  result,
  style,
  varga,
}: {
  result: DetailedKundli;
  style: Style;
  varga: (typeof VARGAS)[number];
}) {
  const cells = useMemo(
    () => buildVargaCells(result, varga.factor),
    [result, varga.factor],
  );
  const title = `${varga.id} · ${varga.name}`;

  const chart =
    style === "north" ? (
      <NorthIndianChart cells={cells} title={title} />
    ) : style === "south" ? (
      <SouthIndianChart cells={cells} title={title} />
    ) : (
      <EastIndianChart cells={cells} title={title} />
    );

  return (
    <div className="varga-card" id={vargaAnchorId(varga.id)}>
      <div className="single-chart">{chart}</div>
      <p className="varga-desc">{varga.description}</p>
    </div>
  );
}

export default function DivisionalCharts({ result, style }: Props) {
  return (
    <div className="panel">
      <h3>Divisional Charts (Shodashavarga)</h3>
      <p className="muted">
        Sixteen divisional charts (vargas) refine each life area beyond the Rashi
        chart.
      </p>
      <div className="varga-grid">
        {VARGAS.map((v) => (
          <VargaCard key={v.id} result={result} style={style} varga={v} />
        ))}
      </div>
    </div>
  );
}
