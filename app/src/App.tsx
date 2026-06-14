import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Liquid } from "liquidjs";
import type { BirthInput } from "./astro/types";
import type { DetailedKundli } from "./astro/kundli";
import { generateKundli } from "./astro/kundli";
import { buildKundliJson } from "./astro/kundliJson";
import { VARGAS } from "./astro/vargas";
import BirthForm, { type ChartStyle } from "./components/BirthForm";
import templateSrc from "./templates/kundli.liquid?raw";

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

const engine = new Liquid({ cache: false });

function varshphalYears(result: DetailedKundli): number[] {
  const birthYear = result.utcDate.getUTCFullYear();
  const thisYear = new Date().getFullYear();
  const start = Math.max(birthYear, result.input.varshphalStartYear ?? thisYear);
  const end = Math.max(start, result.input.varshphalEndYear ?? start);
  const capped = Math.min(end, start + 49);
  const years: number[] = [];
  for (let y = start; y <= capped; y++) years.push(y);
  return years;
}

function download(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Wrap the rendered template output in a standalone HTML document that frames
 * each section as a centred, letter-size paper sheet — matching the on-screen
 * viewer — and prints one section per Letter page. The template carries its own
 * typography, so only the page-sheet framing is added here.
 */
function buildExportHtml(bodyHtml: string, title: string): string {
  const css = `
    * { box-sizing: border-box; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      margin: 0;
      padding: 1.5rem;
      background:
        radial-gradient(1100px 620px at 78% -8%, rgba(138, 79, 212, 0.1), transparent 60%),
        radial-gradient(900px 520px at 8% 0%, rgba(224, 169, 59, 0.12), transparent 55%),
        radial-gradient(circle at top, #ffffff, #f5f1ea);
      background-attachment: fixed;
      -webkit-font-smoothing: antialiased;
    }
    .kundli-doc {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }
    .doc-page {
      width: 8.5in;
      min-height: 11in;
      max-width: 100%;
      background: #fff;
      border: 1px solid #ddd4ca;
      box-shadow: 0 10px 30px -14px rgba(60, 40, 10, 0.25);
      padding: 0.6in 0.7in 0.8in;
    }
    @page { size: letter; margin: 14mm; }
    @media print {
      body { padding: 0; background: #fff; }
      .kundli-doc { gap: 0; }
      .doc-page {
        width: auto;
        min-height: 0;
        height: auto;
        max-width: none;
        border: none;
        box-shadow: none;
        padding: 0;
        break-after: page;
        page-break-after: always;
      }
      .doc-page:last-child { break-after: auto; page-break-after: auto; }
      .kp-table, .kp-chart { break-inside: avoid; }
      .kp-table tr { break-inside: avoid; }
    }`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${css}</style></head><body>${bodyHtml}</body></html>`;
}

/** Refined celestial emblem (yantra ring + inscribed square) for brand surfaces. */
function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="18.2" stroke="currentColor" strokeWidth="1.3" opacity="0.45" />
      <circle cx="20" cy="20" r="13.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M20 6.6 33.4 20 20 33.4 6.6 20Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M20 11.7 28.3 20 20 28.3 11.7 20Z" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <circle cx="20" cy="20" r="1.9" fill="currentColor" />
      <path d="M20 1.4v3.2M20 35.4v3.2M1.4 20h3.2M35.4 20h3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/** Crisp line icons for the landing feature list. */
const FEATURE_ICONS = {
  styles: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 12h18M12 3v18" />
    </svg>
  ),
  charts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  dashas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  ),
  print: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9V3h12v6" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="7" rx="1" />
    </svg>
  ),
};

/** Compact line icons for each document section in the sidebar. */
const PAGE_ICONS: Record<PageId, ReactElement> = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 3h9l5 5v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8M8 17h6" />
    </svg>
  ),
  planets: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.4 5.4l2 2M16.6 16.6l2 2M18.6 5.4l-2 2M7.4 16.6l-2 2" />
    </svg>
  ),
  shadbala: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 20V11M10 20V5M15 20v-6M20 20V8" />
    </svg>
  ),
  charts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
    </svg>
  ),
  dashas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  ),
  ashtaka: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="4" width="17" height="16" rx="1.8" />
      <path d="M3.5 9.5h17M3.5 15h17M9.5 4v16M15 4v16" />
    </svg>
  ),
  yogas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.9 5.4L19.5 10l-5.6 1.6L12 17l-1.9-5.4L4.5 10l5.6-1.6L12 3Z" />
    </svg>
  ),
  varshphal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17M8 2.5v4M16 2.5v4" />
    </svg>
  ),
  interpretation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4a2 2 0 0 1 2-2h12v16H7a2 2 0 0 0-2 2V4Z" />
      <path d="M9 6h6M9 10h6" />
    </svg>
  ),
};

export default function App() {
  const [result, setResult] = useState<DetailedKundli | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [style, setStyle] = useState<ChartStyle>("north");
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [navOpen, setNavOpen] = useState(false);

  const navRef = useRef<HTMLElement | null>(null);

  // Build the flat view-model and render it through the Liquid template. This
  // single template produces the entire kundli document (every section).
  const data = useMemo(
    () => (result ? buildKundliJson(result, style) : null),
    [result, style],
  );
  const [html, setHtml] = useState("");
  const [tplError, setTplError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      setHtml("");
      return;
    }
    let cancelled = false;
    setTplError(null);
    engine
      .parseAndRender(templateSrc, data as unknown as Record<string, unknown>)
      .then((out) => {
        if (!cancelled) setHtml(out);
      })
      .catch((e: unknown) => {
        if (!cancelled) setTplError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [data]);

  // Keep the active nav item visible within the (scrollable) sidebar.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector(
      ".nav-sublink.active, .nav-link.active",
    ) as HTMLElement | null;
    if (active) active.scrollIntoView({ block: "nearest" });
  }, [activePage, activeAnchor, openGroups]);

  // Prevent body scroll while the mobile nav drawer is open.
  useEffect(() => {
    document.body.classList.toggle("nav-locked", navOpen);
    return () => document.body.classList.remove("nav-locked");
  }, [navOpen]);

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
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setNavOpen(false);
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

  function handleExport() {
    download(
      `${baseName}.html`,
      buildExportHtml(html, subject || "Kundli"),
      "text/html",
    );
  }

  const navGroups = useMemo(() => {
    if (!result) return {} as Record<string, { id: string; label: string }[]>;
    return {
      charts: VARGAS.map((v) => ({
        id: `varga-${v.id}`,
        label: `${v.id} · ${v.name}`,
      })),
      dashas: result.dashas.map((m) => ({
        id: `dasha-${m.lord}-${m.start.getTime()}`,
        label: `${m.lord} Mahadasha`,
      })),
      varshphal: varshphalYears(result).map((y) => ({
        id: `varsha-${y}`,
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
      const el = document.getElementById(p.id);
      if (el) observer.observe(el);
    });
    Object.keys(anchorToPage).forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [result, navGroups, html]);

  const subject = result?.input.name?.trim();
  const baseName = (subject || "kundli").replace(/\s+/g, "_").toLowerCase();

  // ---- Landing (no chart yet) ----
  if (!result) {
    return (
      <div className="landing">
        <div className="landing-bg" aria-hidden />
        <div className="landing-inner">
          <section className="landing-hero">
            <div className="landing-brand">
              <BrandMark className="landing-mark" />
              <span className="landing-badge">Vedic Astrology · Sidereal</span>
            </div>
            <h1 className="landing-title">
              Kundli <span className="accent">Maker</span>
            </h1>
            <p className="landing-tagline">
              Generate a complete sidereal birth chart — divisional charts,
              dashas, ashtakavarga, yogas &amp; Varshphal — as a clean,
              printable document.
            </p>
            <ul className="landing-features">
              <li>
                <span className="lf-icon">{FEATURE_ICONS.styles}</span>
                <div>
                  <strong>North · South · East</strong>
                  <p>Switch chart styles instantly</p>
                </div>
              </li>
              <li>
                <span className="lf-icon">{FEATURE_ICONS.charts}</span>
                <div>
                  <strong>16 Divisional Charts</strong>
                  <p>D1 through D60 with dignities</p>
                </div>
              </li>
              <li>
                <span className="lf-icon">{FEATURE_ICONS.dashas}</span>
                <div>
                  <strong>Dashas &amp; Transits</strong>
                  <p>Vimshottari periods &amp; Varshphal</p>
                </div>
              </li>
              <li>
                <span className="lf-icon">{FEATURE_ICONS.print}</span>
                <div>
                  <strong>Print &amp; Save PDF</strong>
                  <p>Page-wise, Letter-size document</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="landing-card">
            <header className="landing-card-head">
              <span className="landing-card-eyebrow">Birth details</span>
              <h2 className="landing-card-title">Cast your chart</h2>
            </header>
            <BirthForm onSubmit={handleSubmit} style={style} onStyleChange={setStyle} />
            {error && <p className="error">{error}</p>}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={`app${navOpen ? " nav-open" : ""}`}>
      {/* ---- Mobile top bar ---- */}
      <header className="mobile-bar no-print">
        <button
          className="mobile-menu-btn"
          onClick={() => setNavOpen((o) => !o)}
          aria-label={navOpen ? "Close menu" : "Open menu"}
          aria-expanded={navOpen}
        >
          <span className="mobile-menu-icon" />
        </button>
        <span className="mobile-bar-title">{subject || "Kundli"}</span>
        <button className="mobile-print" onClick={() => window.print()}>
          PDF / Print
        </button>
      </header>

      {/* ---- Backdrop (mobile drawer) ---- */}
      <div
        className="nav-backdrop no-print"
        onClick={() => setNavOpen(false)}
        aria-hidden
      />

      {/* ---- Left navigation ---- */}
      <nav className={`app-nav${navOpen ? " open" : ""}`} ref={navRef}>
        <div className="nav-brand">
          <BrandMark className="nav-mark" />
          <div className="nav-wordmark">
            <h1>Kundli</h1>
            <span>Vedic birth chart</span>
          </div>
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
          {PAGES.map((p) => {
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
                    <span className="nav-ic">{PAGE_ICONS[p.id]}</span>
                    <span className="nav-label">{p.label}</span>
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
          <div className="nav-actions">
            <button className="nav-print" onClick={() => window.print()}>
              PDF / Print
            </button>
            <button className="nav-export" onClick={handleExport}>
              Export
            </button>
          </div>
        </div>
      </nav>

      {/* ---- Document (rendered entirely from the Liquid template) ---- */}
      <main className="doc">
        {showForm ? (
          <div className="doc-edit">
            <div className="doc-edit-head">
              <strong>Edit details</strong>
              <button
                className="nav-form-close"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="doc-edit-body">
              <BirthForm onSubmit={handleSubmit} initial={result.input} style={style} onStyleChange={setStyle} />
              {error && <p className="error">{error}</p>}
            </div>
          </div>
        ) : (
          <>
            {tplError && <p className="error">Template error: {tplError}</p>}
            <div className="doc-render" dangerouslySetInnerHTML={{ __html: html }} />
          </>
        )}
      </main>
    </div>
  );
}
