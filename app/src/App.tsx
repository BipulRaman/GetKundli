import { useEffect, useMemo, useRef, useState } from "react";
import type { BirthInput } from "./astro/types";
import type { DetailedKundli } from "./astro/kundli";
import { generateKundli } from "./astro/kundli";
import { buildNavamsaCells, buildSignCells } from "./components/chartLayout";
import { VARGAS } from "./astro/vargas";
import BirthForm from "./components/BirthForm";
import NorthIndianChart from "./components/NorthIndianChart";
import SouthIndianChart from "./components/SouthIndianChart";
import EastIndianChart from "./components/EastIndianChart";
import PlanetTable from "./components/PlanetTable";
import Shadbala from "./components/Shadbala";
import DashaTable, { dashaAnchorId } from "./components/DashaTable";
import Interpretations from "./components/Interpretations";
import Panchang from "./components/Panchang";
import DivisionalCharts, { vargaAnchorId } from "./components/DivisionalCharts";
import Ashtakavarga from "./components/Ashtakavarga";
import YogasDoshas from "./components/YogasDoshas";
import Varshphal, { varshphalAnchorId, varshphalYears } from "./components/Varshphal";

type Style = "north" | "south" | "east";

type PageId =
  | "overview"
  | "planets"
  | "shadbala"
  | "charts"
  | "dashas"
  | "ashtaka"
  | "yogas"
  | "varshphal"
  | "interpretation";

const STYLES: { id: Style; label: string }[] = [
  { id: "north", label: "North" },
  { id: "south", label: "South" },
  { id: "east", label: "East" },
];

const PAGES: { id: PageId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "planets", label: "Planets" },
  { id: "shadbala", label: "Shadbala" },
  { id: "charts", label: "Divisional Charts" },
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
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const pageRefs = useRef<Record<string, HTMLElement | null>>({});
  const navRef = useRef<HTMLElement | null>(null);

  // Keep the active nav item visible within the (scrollable) sidebar.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector(
      ".nav-sublink.active, .nav-link.active",
    ) as HTMLElement | null;
    if (active) active.scrollIntoView({ block: "nearest" });
  }, [activePage, activeAnchor, openGroups]);

  function handleSubmit(input: BirthInput) {
    try {
      setError(null);
      setResult(generateKundli(input));
      setActivePage("overview");
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Calculation failed.");
      setResult(null);
    }
  }

  function jumpTo(id: string) {
    const el = pageRefs.current[id] ?? document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleGroup(id: string) {
    setOpenGroups((g) => ({ ...g, [id]: !g[id] }));
  }

  function expandAll() {
    const all: Record<string, boolean> = {};
    Object.keys(navGroups).forEach((id) => {
      if ((navGroups[id]?.length ?? 0) > 0) all[id] = true;
    });
    setOpenGroups(all);
  }

  function collapseAll() {
    setOpenGroups({});
  }

  const navGroups = useMemo(() => {
    if (!result) return {} as Record<string, { id: string; label: string }[]>;
    return {
      charts: VARGAS.map((v) => ({
        id: vargaAnchorId(v.id),
        label: `${v.id} · ${v.name}`,
      })),
      dashas: result.dashas.map((m) => ({
        id: dashaAnchorId(m),
        label: `${m.lord} Mahadasha`,
      })),
      varshphal: varshphalYears(result).map((y) => ({
        id: varshphalAnchorId(y),
        label: `Year ${y}`,
      })),
    };
  }, [result]);

  // Highlight the page currently in view.
  useEffect(() => {
    if (!result) return;
    // Map every child anchor id back to its parent page id.
    const anchorToPage: Record<string, PageId> = {};
    (Object.keys(navGroups) as PageId[]).forEach((pid) => {
      navGroups[pid]?.forEach((c) => {
        anchorToPage[c.id] = pid;
      });
    });
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const id = visible.target.id;
        if (anchorToPage[id]) {
          // A sub-section is in view.
          const parent = anchorToPage[id];
          setActivePage(parent);
          setActiveAnchor(id);
          setOpenGroups((g) => (g[parent] ? g : { ...g, [parent]: true }));
        } else {
          setActivePage(id as PageId);
          setActiveAnchor(null);
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    PAGES.forEach((p) => {
      const el = pageRefs.current[p.id];
      if (el) observer.observe(el);
    });
    Object.keys(anchorToPage).forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [result, navGroups]);

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

  const setPageRef = (id: PageId) => (el: HTMLElement | null) => {
    pageRefs.current[id] = el;
  };

  const subject = result?.input.name?.trim();

  // ---- Landing (no chart yet) ----
  if (!result) {
    return (
      <div className="landing">
        <div className="landing-bg" aria-hidden />
        <div className="landing-inner">
          <section className="landing-hero">
            <span className="landing-badge">✦ Vedic Astrology</span>
            <h1 className="landing-title">Kundli Maker</h1>
            <p className="landing-tagline">
              Generate a complete sidereal birth chart — divisional charts,
              dashas, ashtakavarga, yogas &amp; Varshphal — as a clean,
              printable document.
            </p>
            <ul className="landing-features">
              <li>
                <span className="lf-icon">◓</span>
                <div>
                  <strong>North · South · East</strong>
                  <p>Switch chart styles instantly</p>
                </div>
              </li>
              <li>
                <span className="lf-icon">✶</span>
                <div>
                  <strong>16 Divisional Charts</strong>
                  <p>D1 through D60 with dignities</p>
                </div>
              </li>
              <li>
                <span className="lf-icon">◷</span>
                <div>
                  <strong>Dashas &amp; Transits</strong>
                  <p>Vimshottari periods &amp; Varshphal</p>
                </div>
              </li>
              <li>
                <span className="lf-icon">⎙</span>
                <div>
                  <strong>Print &amp; Save PDF</strong>
                  <p>Page-wise, Letter-size document</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="landing-card">
            <h2 className="landing-card-title">Enter birth details</h2>
            <BirthForm onSubmit={handleSubmit} />
            {error && <p className="error">{error}</p>}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ---- Left navigation ---- */}
      <nav className="app-nav" ref={navRef}>
        <div className="nav-brand">
          <h1>Kundli</h1>
          <span>Vedic birth chart</span>
        </div>

        <div className="nav-subject">
          {subject && <strong>{subject}</strong>}
          <button className="nav-edit" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Close" : "Edit details"}
          </button>
        </div>

        <div className="nav-tools">
          <button className="nav-tool" onClick={expandAll}>
            Expand all
          </button>
          <span className="nav-tool-sep">·</span>
          <button className="nav-tool" onClick={collapseAll}>
            Collapse all
          </button>
        </div>

        <ul className="nav-pages">
          {PAGES.map((p, i) => {
            const children = navGroups[p.id] ?? [];
            const hasChildren = children.length > 0;
            const open = openGroups[p.id];
            return (
              <li key={p.id}>
                <div className="nav-row">
                  <button
                    className={activePage === p.id ? "nav-link active" : "nav-link"}
                    onClick={() => {
                      jumpTo(p.id);
                      if (hasChildren) {
                        setOpenGroups((g) => ({ ...g, [p.id]: true }));
                      }
                    }}
                  >
                    <span className="nav-num">{i + 1}</span>
                    {p.label}
                  </button>
                  {hasChildren && (
                    <button
                      className="nav-toggle"
                      onClick={() => toggleGroup(p.id)}
                      aria-label={open ? "Collapse" : "Expand"}
                      aria-expanded={open}
                    >
                      <span className={open ? "nav-caret open" : "nav-caret"} />
                    </button>
                  )}
                </div>
                {hasChildren && open && (
                  <ul className="nav-sub">
                    {children.map((c) => (
                      <li key={c.id}>
                        <button
                          className={
                            activeAnchor === c.id
                              ? "nav-sublink active"
                              : "nav-sublink"
                          }
                          onClick={() => jumpTo(c.id)}
                        >
                          {c.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        <div className="nav-controls">
          <span className="nav-controls-label">Chart style</span>
          <div className="nav-style">
            {STYLES.map((s) => (
              <button
                key={s.id}
                className={
                  style === s.id ? "nav-style-btn active" : "nav-style-btn"
                }
                onClick={() => setStyle(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button className="nav-print" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>

        {showForm && (
          <div className="nav-form-overlay">
            <div className="nav-form-head">
              <strong>Edit details</strong>
              <button
                className="nav-form-close"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="nav-form-body">
              <BirthForm onSubmit={handleSubmit} initial={result.input} />
              {error && <p className="error">{error}</p>}
            </div>
          </div>
        )}
      </nav>

      {/* ---- Document ---- */}
      <main className="doc">
        <div className="doc-pages">
            <section id="overview" ref={setPageRef("overview")} className="doc-page">
              <header className="doc-page-head">
                <h2>Overview</h2>
                {subject && <p className="doc-subject">{subject}</p>}
              </header>
              <div className="charts">
                {renderChart(lagnaCells, "Rashi (D1)")}
                {renderChart(navamsaCells, "Navamsa (D9)")}
              </div>
              <Panchang result={result} />
              <span className="doc-page-no">Page 1</span>
            </section>

            <section id="planets" ref={setPageRef("planets")} className="doc-page">
              <header className="doc-page-head">
                <h2>Planets</h2>
              </header>
              <PlanetTable result={result} />
              <span className="doc-page-no">Page 2</span>
            </section>

            <section id="shadbala" ref={setPageRef("shadbala")} className="doc-page">
              <header className="doc-page-head">
                <h2>Shadbala</h2>
              </header>
              <Shadbala result={result} />
              <span className="doc-page-no">Page 3</span>
            </section>

            <section id="charts" ref={setPageRef("charts")} className="doc-page">
              <header className="doc-page-head">
                <h2>Divisional Charts</h2>
              </header>
              <DivisionalCharts result={result} style={style} />
              <span className="doc-page-no">Page 4</span>
            </section>

            <section id="dashas" ref={setPageRef("dashas")} className="doc-page">
              <header className="doc-page-head">
                <h2>Vimshottari Dashas</h2>
              </header>
              <DashaTable result={result} />
              <span className="doc-page-no">Page 5</span>
            </section>

            <section id="ashtaka" ref={setPageRef("ashtaka")} className="doc-page">
              <header className="doc-page-head">
                <h2>Ashtakavarga</h2>
              </header>
              <Ashtakavarga result={result} />
              <span className="doc-page-no">Page 6</span>
            </section>

            <section id="yogas" ref={setPageRef("yogas")} className="doc-page">
              <header className="doc-page-head">
                <h2>Yogas &amp; Doshas</h2>
              </header>
              <YogasDoshas result={result} />
              <span className="doc-page-no">Page 7</span>
            </section>

            <section id="varshphal" ref={setPageRef("varshphal")} className="doc-page">
              <header className="doc-page-head">
                <h2>Varshphal</h2>
              </header>
              <Varshphal result={result} style={style} />
              <span className="doc-page-no">Page 8</span>
            </section>

            <section
              id="interpretation"
              ref={setPageRef("interpretation")}
              className="doc-page"
            >
              <header className="doc-page-head">
                <h2>Interpretation</h2>
              </header>
              <Interpretations result={result} />
              <span className="doc-page-no">Page 9</span>
            </section>
        </div>
      </main>
    </div>
  );
}
