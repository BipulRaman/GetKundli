import type { DetailedKundli } from "../astro/kundli";

interface Props {
  result: DetailedKundli;
}

function fmtTime(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Panchang({ result }: Props) {
  const p = result.panchang;
  return (
    <div className="panel">
      <h3>Panchang (Five Limbs)</h3>
      <div className="panchang-grid">
        <div className="pc-item">
          <span className="pc-label">Vara (Weekday)</span>
          <span className="pc-value">{p.vara}</span>
        </div>
        <div className="pc-item">
          <span className="pc-label">Tithi</span>
          <span className="pc-value">
            {p.tithi.paksha} {p.tithi.name}
          </span>
        </div>
        <div className="pc-item">
          <span className="pc-label">Nakshatra</span>
          <span className="pc-value">{p.nakshatra.name}</span>
        </div>
        <div className="pc-item">
          <span className="pc-label">Yoga</span>
          <span className="pc-value">{p.yoga.name}</span>
        </div>
        <div className="pc-item">
          <span className="pc-label">Karana</span>
          <span className="pc-value">{p.karana.name}</span>
        </div>
        <div className="pc-item">
          <span className="pc-label">Sunrise</span>
          <span className="pc-value">{fmtTime(p.sunrise)}</span>
        </div>
        <div className="pc-item">
          <span className="pc-label">Sunset</span>
          <span className="pc-value">{fmtTime(p.sunset)}</span>
        </div>
        <div className="pc-item">
          <span className="pc-label">Lunar phase</span>
          <span className="pc-value">{p.moonPhase.toFixed(1)}° elongation</span>
        </div>
      </div>
    </div>
  );
}
