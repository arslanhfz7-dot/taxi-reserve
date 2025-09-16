// src/components/ReservationRow.tsx
"use client";

import { useState, useTransition } from "react";
import { updateReservationField } from "@/app/reservations/actions";
import type { ReservationStatus } from "@/app/reservations/actions";

const STATUS_OPTIONS: ReservationStatus[] = [
  "Pending",
  "Assigned",
  "Completed",
  "R received",
];

type Props = {
  res: {
    id: string;
    startAt: string | Date;
    pickupText: string | null;
    dropoffText: string | null;
    pax: number | null;
    priceEuro: number | null;
    notes: string | null;
    status: ReservationStatus;
  };
};

export default function ReservationRow({ res }: Props) {
  const [isPending, startTransition] = useTransition();

  const [status, setStatus] = useState<ReservationStatus>(res.status);
  const [notes, setNotes] = useState(res.notes ?? "");
  const [notesDirty, setNotesDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveStatus = (next: ReservationStatus) => {
    setStatus(next);
    startTransition(async () => {
      try {
        setSaving(true);
        await updateReservationField(res.id, { status: next });
      } finally {
        setSaving(false);
      }
    });
  };

  const saveNotes = () => {
    if (!notesDirty) return;
    startTransition(async () => {
      try {
        setSaving(true);
        await updateReservationField(res.id, { notes });
        setNotesDirty(false);
      } finally {
        setSaving(false);
      }
    });
  };

  const startAtText =
    typeof res.startAt === "string"
      ? new Date(res.startAt).toLocaleString()
      : res.startAt.toLocaleString();

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-slate-900/60 p-3 ring-1 ring-slate-800">
      {/* Left: route, time, notes */}
      <div className="min-w-0">
        <div className="text-sm text-slate-200">
          <span className="font-medium">
            {res.pickupText || "—"}
          </span>
          <span className="mx-1 text-slate-500">→</span>
          <span className="font-medium">
            {res.dropoffText || "—"}
          </span>
        </div>

        <div className="mt-1 text-xs text-slate-400">{startAtText}</div>

        {/* Editable notes */}
        <div className="mt-3">
          <label className="mb-1 block text-xs text-slate-400">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setNotesDirty(true);
            }}
            onBlur={saveNotes}
            placeholder="Add notes…"
            rows={2}
            className="w-full resize-y rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-100 outline-none focus:border-slate-500"
          />
          {notesDirty && (
            <button
              onClick={saveNotes}
              className="mt-1 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Save notes
            </button>
          )}
        </div>
      </div>

      {/* Right: status dropdown + saving state */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="text-right">
          <label className="mb-1 block text-xs text-slate-400">Status</label>
          <select
            value={status}
            onChange={(e) => saveStatus(e.target.value as ReservationStatus)}
            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-100 outline-none focus:border-slate-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {(isPending || saving) && (
          <span className="text-xs text-slate-400">Saving…</span>
        )}
      </div>
    </div>
  );
}
