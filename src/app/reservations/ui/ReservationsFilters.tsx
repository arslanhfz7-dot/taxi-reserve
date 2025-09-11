"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// exactly the four statuses you requested
const STATUS_OPTIONS = ["ALL", "PENDING", "ASSIGNED", "COMPLETED", "R_RECEIVED"];

type Props = {
  defaultValues: { q: string; status: string; from: string; to: string; sort: "asc" | "desc" };
};

export default function ReservationsFilters({ defaultValues }: Props) {
  const [q, setQ] = useState(defaultValues.q);
  const [status, setStatus] = useState(defaultValues.status);
  const [from, setFrom] = useState(defaultValues.from);
  const [to, setTo] = useState(defaultValues.to);
  const [sort, setSort] = useState<"asc" | "desc">(defaultValues.sort);

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => pushParams(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function pushParams() {
    const next = new URLSearchParams(sp.toString());
    sort ? next.set("sort", sort) : next.delete("sort");
    q ? next.set("q", q) : next.delete("q");
    status && status !== "ALL" ? next.set("status", status) : next.delete("status");
    from ? next.set("from", from) : next.delete("from");
    to ? next.set("to", to) : next.delete("to");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="mb-4 grid gap-3 md:grid-cols-5">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search notes, pickup, drop-off, driver…"
        className="md:col-span-2 rounded-md border border-gray-600 bg-gray-900 text-gray-100 px-3 py-2 placeholder-gray-400"
      />

      <select
        value={status}
        onChange={(e) => { setStatus(e.target.value); pushParams(); }}
        className="rounded-md border border-gray-600 bg-gray-900 text-gray-100 px-3 py-2"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s === "R_RECEIVED" ? "R received" : s[0] + s.slice(1).toLowerCase()}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={from}
        onChange={(e) => { setFrom(e.target.value); pushParams(); }}
        className="rounded-md border border-gray-600 bg-gray-900 text-gray-100 px-3 py-2"
      />
      <input
        type="date"
        value={to}
        onChange={(e) => { setTo(e.target.value); pushParams(); }}
        className="rounded-md border border-gray-600 bg-gray-900 text-gray-100 px-3 py-2"
      />

      <div className="md:col-span-5 flex items-center gap-2">
        <label className="text-sm text-gray-400">Sort by time:</label>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value as "asc" | "desc"); pushParams(); }}
          className="rounded-md border border-gray-600 bg-gray-900 text-gray-100 px-3 py-1.5"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </div>
    </div>
  );
}
