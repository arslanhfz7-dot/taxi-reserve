// src/lib/parseStartAt.ts

/** Convert <input type="datetime-local"> (local wall time) to a UTC Date */
export function localInputToUTC(dateTimeLocal: string) {
  if (!dateTimeLocal) return null;
  const s = dateTimeLocal.replace(" ", "T");   // e.g. "2025-09-16T10:45"
  const local = new Date(s);                   // interpreted in *local* TZ
  if (isNaN(local.getTime())) return null;

  // getTimezoneOffset() = UTC - local (in minutes)
  // To get UTC, ADD the offset.
  const utcMs = local.getTime() + local.getTimezoneOffset() * 60000;
  return new Date(utcMs);                      // a true UTC moment
}

/** Relative label like "in 2h 15m" or "5m ago" */
export function relTimeFromNow(isoOrDate: string | Date) {
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  const label = hrs >= 1 ? `${hrs}h${rem ? ` ${rem}m` : ""}` : `${mins}m`;
  return diffMs >= 0 ? `in ${label}` : `${label} ago`;
}
