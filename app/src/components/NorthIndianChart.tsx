import type { SignCell } from "./chartLayout";
import { PLANET_SHORT, SIGN_SHORT } from "../astro/constants";

interface Props {
  cells: SignCell[];
  title?: string;
}

// 12 house anchor points laid out on a 0..4 grid. Houses are fixed; the
// diamonds (1,4,7,10) sit at the edge centers, House 1 is the top diamond.

const SIZE = 360;
const U = SIZE / 4;

// Anchor point (in grid units 0..4) inside each house where the sign label and
// planets are clustered. Tuned so corner-triangle labels stay within bounds.
const HOUSE_ANCHOR: [number, number][] = [
  [2, 1], // 1 top diamond
  [1, 0.62], // 2 top-left triangle
  [0.62, 1], // 3 left-top triangle
  [1, 2], // 4 left diamond
  [0.62, 3], // 5 left-bottom triangle
  [1, 3.38], // 6 bottom-left triangle
  [2, 3], // 7 bottom diamond
  [3, 3.38], // 8 bottom-right triangle
  [3.38, 3], // 9 right-bottom triangle
  [3, 2], // 10 right diamond
  [3.38, 1], // 11 right-top triangle
  [3, 0.62], // 12 top-right triangle
];

export default function NorthIndianChart({ cells, title }: Props) {
  // House -> sign cell. House 1 is the ascendant sign.
  const byHouse = new Map<number, SignCell>();
  for (const c of cells) byHouse.set(c.house, c);

  return (
    <div className="chart-wrap">
      {title && <h4 className="chart-title">{title}</h4>}
      <svg viewBox={`-12 -12 ${SIZE + 24} ${SIZE + 24}`} className="chart-svg">
        <rect x={0} y={0} width={SIZE} height={SIZE} className="chart-frame" />
        {/* Diagonals + inner diamond */}
        <line x1={0} y1={0} x2={SIZE} y2={SIZE} className="chart-line" />
        <line x1={SIZE} y1={0} x2={0} y2={SIZE} className="chart-line" />
        <polygon
          points={`${SIZE / 2},0 ${SIZE},${SIZE / 2} ${SIZE / 2},${SIZE} 0,${SIZE / 2}`}
          className="chart-line"
          fill="none"
        />
        {HOUSE_ANCHOR.map((anchor, i) => {
          const house = i + 1;
          const cell = byHouse.get(house);
          const cx = anchor[0] * U;
          const cy = anchor[1] * U;
          const planets = cell?.planets ?? [];
          // Center the planet row(s) horizontally around the anchor.
          const perRow = 3;
          return (
            <g key={house}>
              <text x={cx} y={cy - 8} className="house-sign">
                {cell ? SIGN_SHORT[cell.sign] : ""}
              </text>
              {planets.map((p, idx) => {
                const rowCount = Math.min(planets.length - Math.floor(idx / perRow) * perRow, perRow);
                const col = idx % perRow;
                const x = cx + (col - (rowCount - 1) / 2) * 22;
                const y = cy + 10 + Math.floor(idx / perRow) * 15;
                return (
                  <text
                    key={p.id}
                    x={x}
                    y={y}
                    className={`planet${p.retrograde ? " retro" : ""}`}
                  >
                    {PLANET_SHORT[p.id]}
                  </text>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
