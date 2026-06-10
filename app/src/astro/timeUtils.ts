import type { BirthInput } from "./types";

/**
 * UTC offset (in hours) that a given IANA time zone was observing at a specific
 * UTC instant. Uses the browser's Intl engine, so DST and historical rule
 * changes are handled automatically. Positive = east of Greenwich.
 */
function zoneOffsetHoursAt(timeZone: string, instant: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(instant);
  const map: Record<string, number> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = Number(p.value);
  // Intl can format hour as "24" at midnight; normalise to 0.
  const hour = map.hour === 24 ? 0 : map.hour;
  const asUTC = Date.UTC(map.year, map.month - 1, map.day, hour, map.minute, map.second);
  return (asUTC - instant.getTime()) / 3600000;
}

/**
 * Resolve the UTC offset (hours) for a wall-clock birth time in a named zone.
 * Two-step solve handles the offset changing across DST boundaries.
 */
export function resolveOffsetHours(input: BirthInput): number {
  if (!input.timeZone) return input.tzOffsetHours;

  const wallAsUtc = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute,
    input.second,
  );
  let offset = zoneOffsetHoursAt(input.timeZone, new Date(wallAsUtc));
  const corrected = zoneOffsetHoursAt(
    input.timeZone,
    new Date(wallAsUtc - offset * 3600000),
  );
  if (corrected !== offset) offset = corrected;
  return offset;
}

/**
 * Convert a local birth date/time into a UTC Date object. When a time zone is
 * supplied the offset is derived from it (DST-aware); otherwise the explicit
 * tzOffsetHours is used.
 */
export function birthToUtc(input: BirthInput): Date {
  const localMs = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute,
    input.second,
  );
  const offset = resolveOffsetHours(input);
  return new Date(localMs - offset * 3600000);
}
