// src/components/ReservationsList.tsx
"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/* ---------- Types ---------- */
type Reservation = {
  id: string;
  startAt: string;             // ISO from server
  endAt?: string | null;
  pickupText?: string | null;
  dropoffText?: string | null;
  pax: number;
  priceEuro?: number | null;
  phone?: string | null;
  flight?: string | null;
  notes?: string | null;
  status: "PENDING" | "ASSIGNED" | "COMPLETED" | "R_RECEIVED" | string;
};

type Props = { items: Reservation[] };

/* ---------- Helpers ---------- */
function fmtDateParts(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

function labelStatus(s: Reservation["status"]) {
  if (s === "R_RECEIVED") return "R received";
  return s.charAt(0) + s.slice(1).toLowerCase();
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
  const [openId, setOpenId] = useState<string | null>(null);
  const [rows, setRows] = useState(items);
  const [busyId, setBusyId] = useState<string | null>(null);

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
        No reservations match your filters.
      </div>
    );
  }

  return (
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
                <span
                  className={`ml-2 rounded-full px-2.5 py-0.5 text-xs ${
                    r.status === "COMPLETED"
                      ? "bg-green-500/15 text-green-300"
                      : r.status === "ASSIGNED"
                      ? "bg-blue-500/15 text-blue-300"
                      : r.status === "R_RECEIVED"
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-neutral-500/15 text-neutral-300"
                  }`}
                >
                  {labelStatus(r.status)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOpenId(open ? null : r.id)}
                  className="rounded-md border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
                >
                  {open ? "Hide" : "Details"}
                </button>

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
                {r.notes && <Field label="Notes" value={<span className="whitespace-pre-wrap">{r.notes}</span>} />}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
