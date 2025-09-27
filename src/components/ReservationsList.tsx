// src/components/ReservationsList.tsx
"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

/* ---------- Types ---------- */
type Reservation = {
  id: string;
  startAt: number;            // epoch ms
  endAt?: number | null;
  pickupText?: string | null;
  dropoffText?: string | null;
  pax: number;
  priceEuro?: number | null;
  phone?: string | null;
  flight?: string | null;
  notes?: string | null;
  // (status removed)
};

type Props = { items: Reservation[] };

/* ---------- Helpers ---------- */
function fmtDateParts(ms: number) {
  const d = new Date(ms);
  const date = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

/* Reusable tiny field row */
function Field({
  label,
  value,
}: {
  label: string;
  value: string | number | ReactNode;
}) {
  return (
    <div className="text-sm leading-6">
      <span className="text-neutral-400 font-medium">{label}: </span>
      <span className="text-neutral-100">{value}</span>
    </div>
  );
}

/* ---------- Component ---------- */
export default function ReservationsList({ items }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // keep local rows (for optimistic delete) but sync when props change (after sort)
  const [rows, setRows] = useState<Reservation[]>(items);
  useEffect(() => setRows(items), [items]);

  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // ---- SORT control (updates ?sort=asc|desc in the URL) ----
  const sort = sp.get("sort") === "asc" ? "asc" : "desc";
  function onChangeSort(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(sp?.toString() || "");
    params.set("sort", e.target.value);
    const url = `${pathname}?${params.toString()}`;
    router.replace(url);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this reservation?")) return;

    // optimistic remove
    setBusyId(id);
    const prev = rows;
    setRows(prev.filter((r) => r.id !== id));

    try {
      const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.refresh(); // revalidate server list
    } catch (e) {
      // rollback on error
      setRows(prev);
      alert("Failed to delete. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-white/10 p-6 text-center text-sm text-neutral-400">
        No reservations found.
      </div>
    );
  }

  return (
    <>
      {/* Sort bar */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-neutral-300">Sort by time:</span>
        <select
          value={sort}
          onChange={onChangeSort}
          className="rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-sm"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </div>

      <ul className="mt-2 grid gap-4">
        {rows.map((r) => {
          const { date, time } = fmtDateParts(r.startAt);
          const open = openId === r.id;

          return (
            <li
              key={r.id}
              className="rounded-xl border border-white/10 bg-[#0e1426] shadow-sm transition hover:border-white/20"
            >
              {/* Header row */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-baseline gap-3">
                  <div className="text-base font-semibold">{date}</div>
                  <div className="text-sm text-neutral-400">{time}</div>
                  {/* status badge was here – removed */}
                </div>

                <div className="flex items-center gap-2 flex-wrap">{/* ← mobile wrap */}
                  <button
                    onClick={() => setOpenId(open ? null : r.id)}
                    className="rounded-md border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
                  >
                    {open ? "Hide" : "Details"}
                  </button>

                  {/* Edit button */}
                  <Link
                    href={`/reservations/${r.id}/edit`}
                    className="rounded-md border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
                    title="Edit reservation"
                  >
                    Edit
                  </Link>

                  <button
                    disabled={busyId === r.id}
                    onClick={() => handleDelete(r.id)}
                    className={`rounded-md px-3 py-1.5 text-sm ${
                      busyId === r.id
                        ? "cursor-wait bg-red-700/40 text-red-200"
                        : "bg-red-600/20 text-red-300 hover:bg-red-600/30"
                    }`}
                    title="Delete reservation"
                  >
                    {busyId === r.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>

              {/* Details */}
              {open && (
                <div className="grid gap-1.5 border-t border-white/10 px-4 py-3">
                  {r.pickupText && <Field label="Pickup" value={r.pickupText} />}
                  {r.dropoffText && <Field label="Drop-off" value={r.dropoffText} />}
                  <Field label="Pax" value={r.pax} />
                  {typeof r.priceEuro === "number" && <Field label="Price" value={`${r.priceEuro}€`} />}
                  {r.phone && <Field label="Phone" value={r.phone} />}
                  {r.flight && <Field label="Flight" value={r.flight} />}
                  {r.notes && (
                    <Field label="Notes" value={<span className="whitespace-pre-wrap">{r.notes}</span>} />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
