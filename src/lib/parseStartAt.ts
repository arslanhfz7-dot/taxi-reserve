// src/lib/parseStartAt.ts

/**
 * Convert an <input type="datetime-local"> (local time) to a UTC Date.
 * Example input: "2025-09-16T13:30"
 */
export function localInputToUTC(dateTimeLocal: string) {
  if (!dateTimeLocal) return null;
  const s = dateTimeLocal.replace(" ", "T");
  const local = new Date(s);
  if (isNaN(local.getTime())) return null;
  const utcMs = local.getTime() - local.getTimezoneOffset() * 60000;
  return new Date(utcMs);
}

/**
 * Short human relative time: "in 2h 10m", "5m ago"
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

  const label = hrs >= 1 ? `${hrs}h${rem ? ` ${rem}m` : ""}` : `${mins}m`;
  return diffMs >= 0 ? `in ${label}` : `${label} ago`;
}

/**
 * Tailwind-ish status chip helper (string so it works in className directly)
 */
export function statusClass(status?: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "ASSIGNED":
      return "bg-blue-100 text-blue-800";
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "R_RECEIVED":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
