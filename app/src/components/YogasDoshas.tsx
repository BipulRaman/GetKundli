import type { DetailedKundli } from "../astro/kundli";

interface Props {
  result: DetailedKundli;
}

export default function YogasDoshas({ result }: Props) {
  return (
    <div className="panel">
      <h3>Yogas &amp; Doshas</h3>

      <h4>Yogas Detected ({result.yogas.length})</h4>
      {result.yogas.length === 0 ? (
        <p className="muted">No yogas from the detected set are present.</p>
      ) : (
        <ul className="yoga-list">
          {result.yogas.map((y) => (
            <li key={y.name}>
              <span className={`yoga-badge ${y.strength === "Strong" ? "strong" : ""}`}>
                {y.strength}
              </span>
              <strong>{y.name}</strong> — {y.description}
            </li>
          ))}
        </ul>
      )}

      <h4>Doshas</h4>
      <ul className="dosha-list">
        {result.doshas.map((d) => (
          <li key={d.name}>
            <span className={`dosha-badge ${d.present ? "present" : "clear"}`}>
              {d.present ? "Present" : "Clear"}
            </span>
            <strong>{d.name}</strong> — {d.detail}
          </li>
        ))}
      </ul>
    </div>
  );
}
