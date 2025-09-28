export function getCalendarLink(resv: {
  id: string;
  startAt: string | Date;
  endAt?: string | Date | null;
  pickupText?: string | null;
}) {
  const start = new Date(resv.startAt);
  const end = new Date(resv.endAt ?? start.getTime() + 60 * 60 * 1000);

  // Format for Google
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmtGCal = (d: Date) =>
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z";

  const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Assign+booking&dates=${fmtGCal(
    start
  )}/${fmtGCal(end)}&details=You+have+a+booking+to+assign+in+45+minutes&location=${
    encodeURIComponent(resv.pickupText ?? "")
  }`;

  // Detect device
  const ua =
    typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";

  const isIOS = /iphone|ipad|ipod|macintosh/.test(ua);
  const isAndroid = /android/.test(ua);

  if (isAndroid) return gcal;
  if (isIOS) return `/api/ics/${resv.id}`;
  // fallback: ICS (works in Outlook/Windows/macOS)
  return `/api/ics/${resv.id}`;
}
