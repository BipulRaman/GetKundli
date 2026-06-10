import type { KundliResult } from "../astro/types";
import { NAKSHATRAS, SIGNS } from "../astro/constants";
import {
  DASHA_THEMES,
  HOUSE_MEANINGS,
  PLANET_SIGNIFICATIONS,
  SIGN_TRAITS,
} from "../data/interpretations";

interface Props {
  result: KundliResult;
}

export default function Interpretations({ result }: Props) {
  const asc = result.ascendant;
  const moon = result.planets.find((p) => p.id === "Moon")!;
  const sun = result.planets.find((p) => p.id === "Sun")!;
  const current = result.currentDasha;

  return (
    <div className="panel">
      <h3>Basic Interpretation</h3>
      <p className="disclaimer">
        These notes are generic, classical significations for guidance and
        learning — not personalized predictions.
      </p>

      <h4>Lagna (Ascendant): {SIGNS[asc.sign]}</h4>
      <p>{SIGN_TRAITS[asc.sign]} This colours your overall temperament, body and
        approach to life.</p>

      <h4>Moon sign (Rashi): {SIGNS[moon.sign]}</h4>
      <p>
        Your mind and emotions follow a {SIGNS[moon.sign]} nature —{" "}
        {SIGN_TRAITS[moon.sign].toLowerCase()} Birth star (Nakshatra):{" "}
        <strong>{NAKSHATRAS[moon.nakshatra]}</strong>, pada {moon.pada}.
      </p>

      <h4>Sun sign: {SIGNS[sun.sign]}</h4>
      <p>{SIGN_TRAITS[sun.sign]} The Sun shows your core identity and vitality.</p>

      <h4>Planets by house</h4>
      <ul className="interp-list">
        {result.planets.map((p) => (
          <li key={p.id}>
            <strong>{p.id}</strong> in house {p.house} ({SIGNS[p.sign]}):{" "}
            {PLANET_SIGNIFICATIONS[p.id]} Here it influences{" "}
            {HOUSE_MEANINGS[p.house - 1].toLowerCase()}
          </li>
        ))}
      </ul>

      {current && (
        <>
          <h4>Current period</h4>
          <p>
            You are in the <strong>{current.maha}</strong> Mahadasha.{" "}
            {DASHA_THEMES[current.maha]} The active sub-period (
            <strong>{current.antar}</strong> Antardasha) adds the flavour of{" "}
            {DASHA_THEMES[current.antar].toLowerCase()}
          </p>
        </>
      )}
    </div>
  );
}
