import { useEffect, useMemo, useState } from "react";
import type { BirthInput } from "../astro/types";
import { resolveOffsetHours } from "../astro/timeUtils";
import { COUNTRIES, countryForZone } from "../data/timezones";

interface Props {
  onSubmit: (input: BirthInput) => void;
}

/** localStorage key for saved kundli inputs. */
const STORAGE_KEY = "kundli.recent";

/** Load saved inputs from localStorage. */
function loadRecents(): BirthInput[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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

/** Flattened, alphabetically grouped list of every Country | TZ Location pair. */
const COUNTRY_ZONE_OPTIONS: CountryZoneOption[] = [...COUNTRIES]
  .sort((a, b) => a.name.localeCompare(b.name))
  .flatMap((c) =>
    c.zones.map((zone) => ({
      value: `${c.code}|${zone}`,
      label: `${c.name} | ${zone.replace(/_/g, " ")}`,
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
};

export default function BirthForm({ onSubmit }: Props) {
  const [form, setForm] = useState<BirthInput>(DEFAULT);
  const [czValue, setCzValue] = useState(DEFAULT_CZ_VALUE);
  const [recents, setRecents] = useState<BirthInput[]>(() => loadRecents());

  function update<K extends keyof BirthInput>(key: K, value: BirthInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Persist recents to localStorage whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recents));
    } catch {
      /* ignore storage errors */
    }
  }, [recents]);

  // Live UTC offset for the chosen zone on the chosen date (DST-aware).
  const offset = useMemo(() => resolveOffsetHours(form), [form]);

  // Picking a Country | TZ Location option sets the zone.
  function onCountryZoneChange(value: string) {
    setCzValue(value);
    const zone = value.split("|")[1];
    if (zone) update("timeZone", zone);
  }

  // Save an input to recents (dedupe by name, newest first).
  function saveRecent(input: BirthInput) {
    setRecents((list) => {
      const filtered = list.filter(
        (r) =>
          (r.name ?? "").trim().toLowerCase() !==
          (input.name ?? "").trim().toLowerCase(),
      );
      return [input, ...filtered].slice(0, 20);
    });
  }

  // Load a saved input back into the form.
  function loadRecent(input: BirthInput) {
    setForm(input);
    const cz = `${countryForZone(input.timeZone ?? "")?.code ?? DEFAULT_COUNTRY}|${input.timeZone}`;
    setCzValue(cz);
  }

  // Remove a saved input.
  function removeRecent(index: number) {
    setRecents((list) => list.filter((_, i) => i !== index));
  }

  return (
    <>
    <form
      className="birth-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name?.trim()) return;
        const input = { ...form, name: form.name.trim() };
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
          <span className="tz-offset">{formatOffset(offset)}</span>
        </div>
      </div>

      <button type="submit" className="primary">
        Generate Kundli
      </button>
    </form>

    {recents.length > 0 && (
      <div className="recents">
        <h3>Recent</h3>
        <ul className="recents-list">
          {recents.map((r, i) => (
            <li key={`${r.name}-${i}`} className="recents-item">
              <button
                type="button"
                className="recents-load"
                onClick={() => loadRecent(r)}
                title="Load into form"
              >
                <span className="recents-name">{r.name}</span>
                <span className="recents-meta">
                  {pad(r.day)}/{pad(r.month)}/{pad(r.year, 4)} ·{" "}
                  {pad(r.hour)}:{pad(r.minute)}
                </span>
              </button>
              <button
                type="button"
                className="recents-remove"
                onClick={() => removeRecent(i)}
                title="Remove"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    )}
    </>
  );
}

function formatOffset(hours: number): string {
  const sign = hours < 0 ? "-" : "+";
  const abs = Math.abs(hours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `UTC${sign}${pad(h)}:${pad(m)}`;
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}
