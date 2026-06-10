import type { SignCell } from "./chartLayout";
import { PLANET_SHORT, SIGN_SHORT } from "../astro/constants";

interface Props {
  cells: SignCell[];
  title?: string;
}

const SIZE = 360;
const U = SIZE / 4;

// Fixed (col,row) grid position for each sign 0-11 in the South Indian layout.
const SIGN_POS: Record<number, [number, number]> = {
  11: [0, 0], // Pisces
  0: [1, 0], // Aries
  1: [2, 0], // Taurus
  2: [3, 0], // Gemini
  3: [3, 1], // Cancer
  4: [3, 2], // Leo
  5: [3, 3], // Virgo
  6: [2, 3], // Libra
  7: [1, 3], // Scorpio
  8: [0, 3], // Sagittarius
  9: [0, 2], // Capricorn
  10: [0, 1], // Aquarius
};

export default function SouthIndianChart({ cells, title }: Props) {
  const bySign = new Map<number, SignCell>();
  for (const c of cells) bySign.set(c.sign, c);

  return (
    <div className="chart-wrap">
      {title && <h4 className="chart-title">{title}</h4>}
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="chart-svg">
        <rect x={0} y={0} width={SIZE} height={SIZE} className="chart-frame" />
        {Object.entries(SIGN_POS).map(([signStr, [col, row]]) => {
          const sign = Number(signStr);
          const cell = bySign.get(sign);
          const x = col * U;
          const y = row * U;
          return (
            <g key={sign}>
              <rect
                x={x}
                y={y}
                width={U}
                height={U}
                className={`grid-cell${cell?.isLagna ? " lagna" : ""}`}
              />
              {cell?.isLagna && (
                <line x1={x} y1={y} x2={x + U / 2.2} y2={y} className="lagna-mark" />
              )}
              <text x={x + 5} y={y + 14} className="house-sign small">
                {SIGN_SHORT[sign]}
              </text>
              {cell?.planets.map((p, idx) => (
                <text
                  key={p.id}
                  x={x + 8 + (idx % 2) * 40}
                  y={y + 36 + Math.floor(idx / 2) * 16}
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
