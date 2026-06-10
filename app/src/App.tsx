import { useMemo, useState } from "react";
import type { BirthInput } from "./astro/types";
import type { DetailedKundli } from "./astro/kundli";
import { generateKundli } from "./astro/kundli";
import { buildNavamsaCells, buildSignCells } from "./components/chartLayout";
import BirthForm from "./components/BirthForm";
import NorthIndianChart from "./components/NorthIndianChart";
import SouthIndianChart from "./components/SouthIndianChart";
import EastIndianChart from "./components/EastIndianChart";
import PlanetTable from "./components/PlanetTable";
import DashaTable from "./components/DashaTable";
import Interpretations from "./components/Interpretations";
import Panchang from "./components/Panchang";
import DivisionalCharts from "./components/DivisionalCharts";
import Ashtakavarga from "./components/Ashtakavarga";
import YogasDoshas from "./components/YogasDoshas";
import Varshphal from "./components/Varshphal";

type Style = "north" | "south" | "east";
type Section =
  | "overview"
  | "charts"
  | "planets"
  | "dashas"
  | "ashtaka"
  | "yogas"
  | "varshphal"
  | "interpretation";

const STYLES: { id: Style; label: string }[] = [
  { id: "north", label: "North Indian" },
  { id: "south", label: "South Indian" },
  { id: "east", label: "East Indian" },
];

const SECTIONS: { id: Section; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "charts", label: "Divisional Charts" },
  { id: "planets", label: "Planets" },
  { id: "dashas", label: "Dashas" },
  { id: "ashtaka", label: "Ashtakavarga" },
  { id: "yogas", label: "Yogas & Doshas" },
  { id: "varshphal", label: "Varshphal" },
  { id: "interpretation", label: "Interpretation" },
];

export default function App() {
  const [result, setResult] = useState<DetailedKundli | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [style, setStyle] = useState<Style>("north");
  const [section, setSection] = useState<Section>("overview");

  function handleSubmit(input: BirthInput) {
    try {
      setError(null);
      setResult(generateKundli(input));
      setSection("overview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Calculation failed.");
      setResult(null);
    }
  }

  const lagnaCells = useMemo(
    () => (result ? buildSignCells(result) : []),
    [result],
  );
  const navamsaCells = useMemo(
    () => (result ? buildNavamsaCells(result) : []),
    [result],
  );

  function renderChart(cells: ReturnType<typeof buildSignCells>, title: string) {
    if (style === "north") return <NorthIndianChart cells={cells} title={title} />;
    if (style === "south") return <SouthIndianChart cells={cells} title={title} />;
    return <EastIndianChart cells={cells} title={title} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Kundli Maker</h1>
        <p>
          Vedic birth chart · sidereal (Lahiri ayanamsa) · divisional charts,
          dashas, ashtakavarga, yogas &amp; Varshphal
        </p>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <BirthForm onSubmit={handleSubmit} />
          {error && <p className="error">{error}</p>}
        </aside>

        <section className="content">
          {!result && (
            <div className="empty">
              <p>Enter birth details and generate the chart to begin.</p>
            </div>
          )}

          {result && (
            <>
              {result.input.name && <h2 className="subject">{result.input.name}</h2>}

              <div className="section-tabs">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    className={section === s.id ? "section-tab active" : "section-tab"}
                    onClick={() => setSection(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {(section === "overview" ||
                section === "charts" ||
                section === "varshphal") && (
                <div className="style-tabs">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      className={style === s.id ? "tab active" : "tab"}
                      onClick={() => setStyle(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              {section === "overview" && (
                <>
                  <div className="charts">
                    {renderChart(lagnaCells, "Rashi (D1)")}
                    {renderChart(navamsaCells, "Navamsa (D9)")}
                  </div>
                  <Panchang result={result} />
                  <PlanetTable result={result} />
                </>
              )}

              {section === "charts" && (
                <DivisionalCharts result={result} style={style} />
              )}

              {section === "planets" && (
                <>
                  <PlanetTable result={result} />
                  <Panchang result={result} />
                </>
              )}

              {section === "dashas" && <DashaTable result={result} />}

              {section === "ashtaka" && <Ashtakavarga result={result} />}

              {section === "yogas" && <YogasDoshas result={result} />}

              {section === "varshphal" && (
                <Varshphal result={result} style={style} />
              )}

              {section === "interpretation" && <Interpretations result={result} />}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
