import type { SignCell, CellPlanet } from "./chartLayout";
import { PLANET_SHORT, SIGN_SHORT } from "./constants";

/**
 * Renders a birth/divisional chart to a standalone SVG markup string in any of
 * the three classical styles. The geometry mirrors the React chart components
 * (North/South/East) so the template-driven document looks identical to the
 * interactive view. Output uses the same CSS classes as the React charts, so
 * existing styles in styles.css apply unchanged.
 */
export type ChartStyle = "north" | "south" | "east";

const SIZE = 360;
const U = SIZE / 4; // North/South grid unit
const G = SIZE / 3; // East grid unit

function planetText(p: CellPlanet, x: number, y: number, degDy = -4): string {
  return (
    `<text x="${x}" y="${y}" class="planet${p.retrograde ? " retro" : ""}">` +
    `${PLANET_SHORT[p.id]}` +
    `<tspan class="planet-deg" dx="1" dy="${degDy}">${Math.round(p.degree)}</tspan>` +
    `</text>`
  );
}

function wrap(viewBox: string, inner: string): string {
  return `<svg viewBox="${viewBox}" class="chart-svg" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

// ---------------- North Indian ----------------

const NORTH_ANCHOR: [number, number][] = [
  [2, 1], [1, 0.62], [0.62, 1], [1, 2], [0.62, 3], [1, 3.38],
  [2, 3], [3, 3.38], [3.38, 3], [3, 2], [3.38, 1], [3, 0.62],
];

function northSvg(cells: SignCell[]): string {
  const byHouse = new Map<number, SignCell>();
  for (const c of cells) byHouse.set(c.house, c);
  const parts: string[] = [];
  parts.push(`<rect x="0" y="0" width="${SIZE}" height="${SIZE}" class="chart-frame" />`);
  parts.push(`<line x1="0" y1="0" x2="${SIZE}" y2="${SIZE}" class="chart-line" />`);
  parts.push(`<line x1="${SIZE}" y1="0" x2="0" y2="${SIZE}" class="chart-line" />`);
  parts.push(
    `<polygon points="${SIZE / 2},0 ${SIZE},${SIZE / 2} ${SIZE / 2},${SIZE} 0,${SIZE / 2}" class="chart-line" fill="none" />`,
  );
  NORTH_ANCHOR.forEach((anchor, i) => {
    const house = i + 1;
    const cell = byHouse.get(house);
    const cx = anchor[0] * U;
    const cy = anchor[1] * U;
    const planets = cell?.planets ?? [];
    parts.push(`<text x="${cx}" y="${cy - 8}" class="house-sign">${cell ? SIGN_SHORT[cell.sign] : ""}</text>`);
    const perRow = 2;
    planets.forEach((p, idx) => {
      const rowCount = Math.min(planets.length - Math.floor(idx / perRow) * perRow, perRow);
      const col = idx % perRow;
      const x = cx + (col - (rowCount - 1) / 2) * 32;
      const y = cy + 10 + Math.floor(idx / perRow) * 14;
      parts.push(planetText(p, x, y));
    });
  });
  return wrap(`-12 -12 ${SIZE + 24} ${SIZE + 24}`, parts.join(""));
}

// ---------------- South Indian ----------------

const SOUTH_POS: Record<number, [number, number]> = {
  11: [0, 0], 0: [1, 0], 1: [2, 0], 2: [3, 0],
  3: [3, 1], 4: [3, 2], 5: [3, 3], 6: [2, 3],
  7: [1, 3], 8: [0, 3], 9: [0, 2], 10: [0, 1],
};

function southSvg(cells: SignCell[]): string {
  const bySign = new Map<number, SignCell>();
  for (const c of cells) bySign.set(c.sign, c);
  const parts: string[] = [];
  parts.push(`<rect x="0" y="0" width="${SIZE}" height="${SIZE}" class="chart-frame" />`);
  for (const [signStr, [col, row]] of Object.entries(SOUTH_POS)) {
    const sign = Number(signStr);
    const cell = bySign.get(sign);
    const x = col * U;
    const y = row * U;
    parts.push(
      `<rect x="${x}" y="${y}" width="${U}" height="${U}" class="grid-cell${cell?.isLagna ? " lagna" : ""}" />`,
    );
    if (cell?.isLagna) {
      parts.push(`<line x1="${x}" y1="${y}" x2="${x + U / 2.2}" y2="${y}" class="lagna-mark" />`);
    }
    parts.push(`<text x="${x + 5}" y="${y + 14}" class="house-sign small">${SIGN_SHORT[sign]}</text>`);
    (cell?.planets ?? []).forEach((p, idx) => {
      const px = x + 8 + (idx % 2) * 40;
      const py = y + 36 + Math.floor(idx / 2) * 16;
      parts.push(planetText(p, px, py));
    });
  }
  return wrap(`0 0 ${SIZE} ${SIZE}`, parts.join(""));
}

// ---------------- East Indian ----------------

interface EastCell {
  sign: number;
  poly: number[][];
  anchor: [number, number];
}

const EAST_CELLS: EastCell[] = [
  { sign: 0, poly: [[0, 0], [1, 0], [1, 1]], anchor: [0.62, 0.35] },
  { sign: 1, poly: [[1, 0], [2, 0], [2, 1], [1, 1]], anchor: [1.5, 0.5] },
  { sign: 2, poly: [[2, 0], [3, 0], [2, 1]], anchor: [2.4, 0.35] },
  { sign: 3, poly: [[3, 0], [3, 1], [2, 1]], anchor: [2.66, 0.66] },
  { sign: 4, poly: [[2, 1], [3, 1], [3, 2], [2, 2]], anchor: [2.5, 1.5] },
  { sign: 5, poly: [[3, 2], [3, 3], [2, 2]], anchor: [2.66, 2.36] },
  { sign: 6, poly: [[2, 2], [3, 3], [2, 3]], anchor: [2.4, 2.66] },
  { sign: 7, poly: [[1, 2], [2, 2], [2, 3], [1, 3]], anchor: [1.5, 2.5] },
  { sign: 8, poly: [[1, 2], [1, 3], [0, 3]], anchor: [0.6, 2.66] },
  { sign: 9, poly: [[0, 2], [1, 2], [0, 3]], anchor: [0.34, 2.4] },
  { sign: 10, poly: [[0, 1], [1, 1], [1, 2], [0, 2]], anchor: [0.5, 1.5] },
  { sign: 11, poly: [[0, 0], [1, 1], [0, 1]], anchor: [0.34, 0.62] },
];

function eastSvg(cells: SignCell[]): string {
  const bySign = new Map<number, SignCell>();
  for (const c of cells) bySign.set(c.sign, c);
  const parts: string[] = [];
  parts.push(`<rect x="0" y="0" width="${SIZE}" height="${SIZE}" class="chart-frame" />`);
  for (const c of EAST_CELLS) {
    const cell = bySign.get(c.sign);
    const planets = cell?.planets ?? [];
    const pts = c.poly.map(([x, y]) => `${x * G},${y * G}`).join(" ");
    const isCorner = c.poly.length === 3;
    parts.push(`<polygon points="${pts}" class="grid-cell${cell?.isLagna ? " lagna" : ""}" />`);

    if (isCorner) {
      const cx = (c.poly.reduce((s, p) => s + p[0], 0) / c.poly.length) * G;
      const cy = (c.poly.reduce((s, p) => s + p[1], 0) / c.poly.length) * G;
      const lh = 11;
      const top = cy - (planets.length * lh) / 2;
      parts.push(`<text x="${cx}" y="${top}" class="house-sign east-compact">${SIGN_SHORT[c.sign]}</text>`);
      planets.forEach((p, idx) => {
        parts.push(
          `<text x="${cx}" y="${top + (idx + 1) * lh}" class="planet east-compact${p.retrograde ? " retro" : ""}">` +
            `${PLANET_SHORT[p.id]}<tspan class="planet-deg" dx="1" dy="-3">${Math.round(p.degree)}</tspan></text>`,
        );
      });
    } else {
      const ax = c.anchor[0] * G;
      const ay = c.anchor[1] * G;
      parts.push(`<text x="${ax}" y="${ay - 14}" class="house-sign small">${SIGN_SHORT[c.sign]}</text>`);
      planets.forEach((p, idx) => {
        const x = ax - 14 + (idx % 2) * 28;
        const y = ay + 2 + Math.floor(idx / 2) * 14;
        parts.push(planetText(p, x, y));
      });
    }
  }
  return wrap(`0 0 ${SIZE} ${SIZE}`, parts.join(""));
}

/** Build an SVG markup string for the given cells in the requested style. */
export function chartSvg(cells: SignCell[], style: ChartStyle): string {
  if (style === "north") return northSvg(cells);
  if (style === "south") return southSvg(cells);
  return eastSvg(cells);
}
