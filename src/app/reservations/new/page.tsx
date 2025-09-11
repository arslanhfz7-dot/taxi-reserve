"use client";
import { useState } from "react";

type FormState = {
  pickupText: string;
  dropoffText: string;
  startAt: string;   // e.g. "2025-09-11T09:30"
  pax: number;
  priceEuro: string; // keep as string in UI; server converts to number/null
  notes: string;
};

export default function NewReservation() {
  const [form, setForm] = useState<FormState>({
    pickupText: "",
    dropoffText: "",
    startAt: "",
    pax: 1,
    priceEuro: "",
    notes: "",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    // Basic client validation (optional but nice)
    if (!form.startAt) {
      setLoading(false);
      setMsg("Please select date & time.");
      return;
    }
    if (form.pax < 1 || form.pax > 99) {
      setLoading(false);
      setMsg("Passengers must be between 1 and 99.");
      return;
    }

    // IMPORTANT: send the raw datetime-local string as-is
    const payload = {
      pickupText: form.pickupText || null,
      dropoffText: form.dropoffText || null,
      startAt: form.startAt,                   // <-- no toISOString()
      pax: form.pax,
      priceEuro: form.priceEuro === "" ? null : Number(form.priceEuro),
      notes: form.notes || null,
    };

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (res.ok) {
      window.location.href = "/reservations";
      return;
    }

    if (res.status === 401) {
      setMsg("Please log in first.");
      window.location.href = "/login";
      return;
    }

    const j = await res.json().catch(() => ({}));
    setMsg(j.error || "Error creating reservation");
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">New reservation</h1>

      <form onSubmit={submit} className="grid gap-3" autoComplete="off">
        <input
          className="border p-2 rounded"
          placeholder="Pickup address"
          value={form.pickupText}
          onChange={(e) => setForm({ ...form, pickupText: e.target.value })}
        />

        <input
          className="border p-2 rounded"
          placeholder="Drop-off address"
          value={form.dropoffText}
          onChange={(e) => setForm({ ...form, dropoffText: e.target.value })}
        />

        <label className="text-sm text-gray-500">Date & time</label>
        <input
          className="border p-2 rounded"
          type="datetime-local"
          step="60"                  // iPhone-friendly, no seconds
          value={form.startAt}
          onChange={(e) => setForm({ ...form, startAt: e.target.value })}
        />

        <input
          className="border p-2 rounded"
          type="number"
          min={1}
          max={99}
          placeholder="Passengers"
          value={form.pax}
          onChange={(e) => setForm({ ...form, pax: Number(e.target.value) })}
        />

        <input
          className="border p-2 rounded"
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="Price (EUR)"
          value={form.priceEuro}
          onChange={(e) => setForm({ ...form, priceEuro: e.target.value })}
        />

        <textarea
          className="border p-2 rounded"
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        <button
          disabled={loading}
          className="bg-black text-white p-2 rounded disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </form>

      {msg && <p className="mt-3 text-red-500">{msg}</p>}
    </div>
  );
}
