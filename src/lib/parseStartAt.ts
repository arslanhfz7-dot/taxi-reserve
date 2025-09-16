// src/lib/parseStartAt.ts
/**
 * Parse a <input type="datetime-local"> value.
 * Example input: "2025-09-16T02:00"
 * We treat it as local time and DO NOT apply manual timezone math.
 */
export function parseStartAt(raw: string): Date {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date");
  }
  return d; // no getTimezoneOffset() adjustments!
}
