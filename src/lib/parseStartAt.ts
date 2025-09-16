// src/lib/parseStartAt.ts

/**
 * Parse a <input type="datetime-local"> value as local time.
 * Example input: "2025-09-16T02:00"
 * We construct the Date in local time (Barcelona) and do NOT shift with UTC.
 */
export function parseStartAt(raw: string): Date {
  if (!raw) throw new Error("startAt is required");

  // 1) datetime-local: "YYYY-MM-DDTHH:mm"
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
    const [datePart, timePart] = raw.split("T");
    const [y, m, d] = datePart.split("-").map(Number);
    const [H, M] = timePart.split(":").map(Number);

    // ✅ Local time (no UTC shift)
    return new Date(y, m - 1, d, H, M, 0);
  }

  // 2) fallback
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid startAt");
  return d;
}
