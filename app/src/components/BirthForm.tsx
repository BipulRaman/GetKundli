import { useEffect, useState } from "react";
import type { BirthInput } from "../astro/types";
import { zoneOffsetHoursAt } from "../astro/timeUtils";
import { COUNTRIES, countryForZone } from "../data/timezones";

interface Props {
  onSubmit: (input: BirthInput) => void;
  initial?: BirthInput;
  style: ChartStyle;
  onStyleChange: (style: ChartStyle) => void;
}

export type ChartStyle = "north" | "south" | "east";

const STYLE_OPTIONS: { id: ChartStyle; label: string }[] = [
  { id: "north", label: "North" },
  { id: "south", label: "South" },
  { id: "east", label: "East" },
];

/** localStorage key for saved kundli inputs. */
const STORAGE_KEY = "kundli.recent";

/** Generate a stable unique id for a saved entry. */
function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `k_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Load saved inputs from localStorage, ensuring every entry has an id. */
function loadRecents(): BirthInput[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    let changed = false;
    const migrated = parsed.map((r: BirthInput) => {
      if (r && !r.id) {
        changed = true;
        return { ...r, id: newId() };
      }
      return r;
    });
    if (changed) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      } catch {
        /* ignore storage errors */
      }
    }
    return migrated;
  } catch {
    return [];
  }
}

/** The user's current zone, used as a sensible default. */
const LOCAL_TZ =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";

/** A single Country + IANA zone pairing for the unified dropdown. */
interface CountryZoneOption {
  /** Composite value: "<countryCode>|<ianaZone>". */
  value: string;
  /** Display label: "Country | TZ Location". */
  label: string;
  countryCode: string;
  zone: string;
}

/** Reference instant used to label each zone's current UTC offset. */
const OFFSET_REF_INSTANT = new Date();

/** Flattened, alphabetically grouped list of every Country | TZ Location pair. */
const COUNTRY_ZONE_OPTIONS: CountryZoneOption[] = [...COUNTRIES]
  .sort((a, b) => a.name.localeCompare(b.name))
  .flatMap((c) =>
    c.zones.map((zone) => ({
      value: `${c.code}|${zone}`,
      label: `${c.name} | ${zone.replace(/_/g, " ")} (${zoneOffsetLabel(zone)})`,
      countryCode: c.code,
      zone,
    }))
  );

/** Preferred default zone (India) when available, else the user's local zone. */
const DEFAULT_TZ = countryForZone("Asia/Kolkata") ? "Asia/Kolkata" : LOCAL_TZ;
const DEFAULT_COUNTRY =
  countryForZone(DEFAULT_TZ)?.code ?? countryForZone("Asia/Kolkata")?.code ?? "IN";
const DEFAULT_CZ_VALUE = `${DEFAULT_COUNTRY}|${DEFAULT_TZ}`;

const DEFAULT: BirthInput = {
  name: "",
  year: 1990,
  month: 1,
  day: 1,
  hour: 12,
  minute: 0,
  second: 0,
  latitude: 28.6139,
  longitude: 77.209,
  timeZone: DEFAULT_TZ,
  tzOffsetHours: 5.5,
  varshphalStartYear: new Date().getFullYear(),
  varshphalEndYear: new Date().getFullYear(),
};

export default function BirthForm({ onSubmit, initial, style, onStyleChange }: Props) {
  const [form, setForm] = useState<BirthInput>(initial ?? DEFAULT);
  const [czValue, setCzValue] = useState(() =>
    initial
      ? `${countryForZone(initial.timeZone ?? "")?.code ?? DEFAULT_COUNTRY}|${initial.timeZone}`
      : DEFAULT_CZ_VALUE,
  );
  const [recents, setRecents] = useState<BirthInput[]>(() => loadRecents());
  const [tab, setTab] = useState<"new" | "recent">("new");

  function update<K extends keyof BirthInput>(key: K, value: BirthInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Sync the form when the initial input changes (e.g. opening the edit form).
  useEffect(() => {
    if (!initial) return;
    setForm(initial);
    setCzValue(
      `${countryForZone(initial.timeZone ?? "")?.code ?? DEFAULT_COUNTRY}|${initial.timeZone}`,
    );
  }, [initial]);

  // Persist recents to localStorage whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recents));
    } catch {
      /* ignore storage errors */
    }
  }, [recents]);

  // Picking a Country | TZ Location option sets the zone.
  function onCountryZoneChange(value: string) {
    setCzValue(value);
    const zone = value.split("|")[1];
    if (zone) update("timeZone", zone);
  }

  // Save an input to recents (dedupe by id, newest first).
  function saveRecent(input: BirthInput) {
    // Compute the next list from what's currently persisted, so this works even
    // if the component is about to unmount (e.g. the edit panel closes on
    // submit). The setRecents updater is NOT guaranteed to run on unmount, so
    // we must write localStorage directly here rather than inside the updater.
    const current = loadRecents();
    const next = [input, ...current.filter((r) => r.id !== input.id)].slice(0, 20);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore storage errors */
    }
    setRecents(next);
  }

  // Load a saved input back into the form.
  function loadRecent(input: BirthInput) {
    setForm(input);
    const cz = `${countryForZone(input.timeZone ?? "")?.code ?? DEFAULT_COUNTRY}|${input.timeZone}`;
    setCzValue(cz);
  }

  // Select a saved input: load it into the form and generate the kundli.
  function selectRecent(input: BirthInput) {
    loadRecent(input);
    onSubmit(input);
  }

  // Remove a saved input.
  function removeRecent(index: number) {
    setRecents((list) => list.filter((_, i) => i !== index));
  }

  return (
    <div className="form-shell">
      <div className="form-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "new"}
          className={tab === "new" ? "form-tab active" : "form-tab"}
          onClick={() => setTab("new")}
        >
          New Entry
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "recent"}
          className={tab === "recent" ? "form-tab active" : "form-tab"}
          onClick={() => setTab("recent")}
        >
          Recent ({recents.length})
        </button>
      </div>

      <div className="form-panels">
      <form
      className={tab === "new" ? "birth-form" : "birth-form panel-hidden"}
      aria-hidden={tab !== "new"}
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name?.trim()) return;
        const input = {
          ...form,
          name: form.name.trim(),
          id: form.id ?? newId(),
        };
        setForm(input);
        saveRecent(input);
        onSubmit(input);
      }}
    >
      <div className="field">
        <label>Name *</label>
        <input
          type="text"
          value={form.name}
          required
          placeholder="Required"
          onChange={(e) => update("name", e.target.value)}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label>Date of birth</label>
          <input
            type="date"
            value={`${pad(form.year, 4)}-${pad(form.month)}-${pad(form.day)}`}
            onChange={(e) => {
              const [y, m, d] = e.target.value.split("-").map(Number);
              setForm((f) => ({ ...f, year: y, month: m, day: d }));
            }}
          />
        </div>
        <div className="field">
          <label>Time of birth</label>
          <input
            type="time"
            step={1}
            value={`${pad(form.hour)}:${pad(form.minute)}:${pad(form.second)}`}
            onChange={(e) => {
              const [h, mi, s = 0] = e.target.value.split(":").map(Number);
              setForm((f) => ({ ...f, hour: h, minute: mi, second: s }));
            }}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Latitude (°N)</label>
          <input
            type="number"
            step="0.0001"
            value={form.latitude}
            onChange={(e) => update("latitude", Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Longitude (°E)</label>
          <input
            type="number"
            step="0.0001"
            value={form.longitude}
            onChange={(e) => update("longitude", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="field-row field-row--top">
        <div className="field">
          <label>Country | TZ Location</label>
          <select
            value={czValue}
            onChange={(e) => onCountryZoneChange(e.target.value)}
          >
            {COUNTRY_ZONE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Varshphal Start Year</label>
          <input
            type="number"
            min={form.year}
            max={form.year + 120}
            value={form.varshphalStartYear ?? new Date().getFullYear()}
            onChange={(e) =>
              update("varshphalStartYear", Number(e.target.value) || form.year)
            }
          />
        </div>
        <div className="field">
          <label>Varshphal End Year</label>
          <input
            type="number"
            min={form.year}
            max={form.year + 120}
            value={form.varshphalEndYear ?? new Date().getFullYear()}
            onChange={(e) =>
              update("varshphalEndYear", Number(e.target.value) || form.year)
            }
          />
        </div>
      </div>

      <div className="field">
        <label>Chart style</label>
        <div className="style-choice" role="radiogroup">
          {STYLE_OPTIONS.map((s) => (
            <label
              key={s.id}
              className={style === s.id ? "style-choice-radio active" : "style-choice-radio"}
            >
              <input
                type="radio"
                name="chart-style"
                value={s.id}
                checked={style === s.id}
                onChange={() => onStyleChange(s.id)}
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      <button type="submit" className="primary">
        Generate Kundli
      </button>
    </form>

      <div
        className={tab === "recent" ? "recents-panel" : "recents-panel panel-hidden"}
        aria-hidden={tab !== "recent"}
      >
        {recents.length === 0 ? (
          <p className="recents-empty">No saved kundli yet. Create one from the “New Entry” tab.</p>
        ) : (
          <ul className="recents-list">
            {recents.map((r, i) => (
              <li key={r.id ?? `${r.name}-${i}`} className="recents-item">
                <button
                  type="button"
                  className="recents-load"
                  onClick={() => selectRecent(r)}
                  title="Load this chart"
                >
                  <span className="recents-name">{r.name || "Unnamed"}</span>
                  <span className="recents-meta">
                    {pad(r.day)}/{pad(r.month)}/{pad(r.year, 4)} ·{" "}
                    {pad(r.hour)}:{pad(r.minute)}
                  </span>
                </button>
                <button
                  type="button"
                  className="recents-remove"
                  onClick={() => removeRecent(i)}
                  title="Delete"
                  aria-label="Delete"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
    </div>
  );
}

function formatOffset(hours: number): string {
  const sign = hours < 0 ? "-" : "+";
  const abs = Math.abs(hours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `UTC${sign}${pad(h)}:${pad(m)}`;
}

/** Format a zone's current UTC offset for the dropdown, e.g. "UTC+05:30". */
function zoneOffsetLabel(zone: string): string {
  try {
    return formatOffset(zoneOffsetHoursAt(zone, OFFSET_REF_INSTANT));
  } catch {
    return "UTC";
  }
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}
