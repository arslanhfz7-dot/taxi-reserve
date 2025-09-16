// src/lib/parseStartAt.ts

/**
 * Convert <input type="datetime-local"> (local time) to UTC Date.
 * Example input: "2025-09-16T10:40"
 * Output: Date in UTC, so DB stores correctly.
 */
export function localInputToUTC(dateTimeLocal: string) {
  if (!dateTimeLocal) return null;
  const s = dateTimeLocal.replace(" ", "T");
  const local = new Date(s);
  if (isNaN(local.getTime())) return null;
  // Adjust by timezone offset
  const utcMs = local.getTime() - local.getTimezoneOffset() * 60000;
  return new Date(utcMs);
}

/**
 * Short human relative time label: "in 2h 15m", "5m ago".
 */
export function relTimeFromNow(isoOrDate: string | Date) {
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();

  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;

  let label: string;
  if (hrs >= 1) {
    label = `${hrs}h${rem ? ` ${rem}m` : ""}`;
  } else {
    label = `${mins}m`;
  }

  return diffMs >= 0 ? `in ${label}` : `${label} ago`;
}