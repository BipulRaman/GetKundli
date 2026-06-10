import type { SignCell } from "./chartLayout";
import { PLANET_SHORT, SIGN_SHORT } from "../astro/constants";

interface Props {
  cells: SignCell[];
  title?: string;
}

const SIZE = 360;
const G = SIZE / 3; // grid unit

// East Indian (Bengali) style: square with the centre blank, mid-edge cells and
// corner cells split diagonally toward the centre. Every cell is labelled with
// its fixed sign, so occupancy is unambiguous. Polygons are in grid units.
interface Cell {
  sign: number;
  poly: number[][];
  anchor: [number, number];
}

const CELLS: Cell[] = [
  // Top-left corner, top triangle -> Aries
  { sign: 0, poly: [[0, 0], [1, 0], [1, 1]], anchor: [0.62, 0.35] },
  // Top-middle -> Taurus
  { sign: 1, poly: [[1, 0], [2, 0], [2, 1], [1, 1]], anchor: [1.5, 0.5] },
  // Top-right corner, top triangle -> Gemini
  { sign: 2, poly: [[2, 0], [3, 0], [2, 1]], anchor: [2.4, 0.35] },
  // Top-right corner, right triangle -> Cancer
  { sign: 3, poly: [[3, 0], [3, 1], [2, 1]], anchor: [2.66, 0.66] },
  // Right-middle -> Leo
  { sign: 4, poly: [[2, 1], [3, 1], [3, 2], [2, 2]], anchor: [2.5, 1.5] },
  // Bottom-right corner, right triangle -> Virgo
  { sign: 5, poly: [[3, 2], [3, 3], [2, 2]], anchor: [2.66, 2.36] },
  // Bottom-right corner, bottom triangle -> Libra
  { sign: 6, poly: [[2, 2], [3, 3], [2, 3]], anchor: [2.4, 2.66] },
  // Bottom-middle -> Scorpio
  { sign: 7, poly: [[1, 2], [2, 2], [2, 3], [1, 3]], anchor: [1.5, 2.5] },
  // Bottom-left corner, bottom triangle -> Sagittarius
  { sign: 8, poly: [[1, 2], [1, 3], [0, 3]], anchor: [0.6, 2.66] },
  // Bottom-left corner, left triangle -> Capricorn
  { sign: 9, poly: [[0, 2], [1, 2], [0, 3]], anchor: [0.34, 2.4] },
  // Left-middle -> Aquarius
  { sign: 10, poly: [[0, 1], [1, 1], [1, 2], [0, 2]], anchor: [0.5, 1.5] },
  // Top-left corner, left triangle -> Pisces
  { sign: 11, poly: [[0, 0], [1, 1], [0, 1]], anchor: [0.34, 0.62] },
];

export default function EastIndianChart({ cells, title }: Props) {
  const bySign = new Map<number, SignCell>();
  for (const c of cells) bySign.set(c.sign, c);

  return (
    <div className="chart-wrap">
      {title && <h4 className="chart-title">{title}</h4>}
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="chart-svg">
        <rect x={0} y={0} width={SIZE} height={SIZE} className="chart-frame" />
        {CELLS.map((c) => {
          const cell = bySign.get(c.sign);
          const pts = c.poly.map(([x, y]) => `${x * G},${y * G}`).join(" ");
          const ax = c.anchor[0] * G;
          const ay = c.anchor[1] * G;
          return (
            <g key={c.sign}>
              <polygon
                points={pts}
                className={`grid-cell${cell?.isLagna ? " lagna" : ""}`}
              />
              <text x={ax} y={ay - 14} className="house-sign small">
                {SIGN_SHORT[c.sign]}
              </text>
              {cell?.planets.map((p, idx) => (
                <text
                  key={p.id}
                  x={ax - 18 + (idx % 2) * 22}
                  y={ay + 2 + Math.floor(idx / 2) * 14}
                  className={`planet${p.retrograde ? " retro" : ""}`}
                >
                  {PLANET_SHORT[p.id]}
                  <tspan className="planet-deg" dx={1}>
                    {Math.round(p.degree)}
                  </tspan>
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
