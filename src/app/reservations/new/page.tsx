// src/app/reservations/new/page.tsx
"use client";

import { useState } from "react";
import { localDateTimeToUtcIso } from "@/lib/parseStartAt";

export default function NewReservation() {
  const [form, setForm] = useState({
    pickupText: "",
    dropoffText: "",
    startAt: "",          // "YYYY-MM-DDTHH:mm"
    pax: 1,
    priceEuro: "",
    phone: "",
    flight: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    // Convert local wall-time -> UTC ISO (ends with "Z")
    const iso = localDateTimeToUtcIso(form.startAt);
    if (!iso) {
      setLoading(false);
      setMsg("Please provide a valid date & time.");
      return;
    }

    const payload = {
      pickupText: form.pickupText || null,
      dropoffText: form.dropoffText || null,
      startAt: iso,                                   // <-- UTC ISO
      pax: Number(form.pax) || 1,
      priceEuro: form.priceEuro ? Number(form.priceEuro) : null,
      phone: form.phone || null,
      flight: form.flight || null,
      notes: form.notes ? form.notes.slice(0, 2000) : null,
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

    const j = await res.json().catch(() => ({ error: "Failed to save" }));
    setMsg(j.error || "Failed to save");
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-2xl font-semibold">New reservation</h1>
      <form onSubmit={submit} className="grid gap-3">
        <input
          className="rounded-md border border-neutral-700 bg-neutral-900 p-2"
          placeholder="Pickup address"
          value={form.pickupText}
          onChange={(e) => setForm({ ...form, pickupText: e.target.value })}
        />
        <input
          className="rounded-md border border-neutral-700 bg-neutral-900 p-2"
          placeholder="Drop-off address"
          value={form.dropoffText}
          onChange={(e) => setForm({ ...form, dropoffText: e.target.value })}
        />
        <div>
          <label className="mb-1 block text-sm">Date & time</label>
          <input
            type="datetime-local"
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 p-2"
            value={form.startAt}
            onChange={(e) => setForm({ ...form, startAt: e.target.value })}
          />
        </div>
        <input
          type="number"
          min={1}
          className="rounded-md border border-neutral-700 bg-neutral-900 p-2"
          value={form.pax}
          onChange={(e) => setForm({ ...form, pax: Number(e.target.value) })}
        />
        <input
          className="rounded-md border border-neutral-700 bg-neutral-900 p-2"
          placeholder="Price (EUR)"
          value={form.priceEuro}
          onChange={(e) => setForm({ ...form, priceEuro: e.target.value })}
        />
        <input
          className="rounded-md border border-neutral-700 bg-neutral-900 p-2"
          placeholder="Client phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className="rounded-md border border-neutral-700 bg-neutral-900 p-2"
          placeholder="Flight number (optional)"
          value={form.flight}
          onChange={(e) => setForm({ ...form, flight: e.target.value })}
        />
        <textarea
          className="min-h-[90px] rounded-md border border-neutral-700 bg-neutral-900 p-2"
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <button
          disabled={loading}
          className="rounded-md bg-white/10 px-4 py-2 hover:bg-white/20 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save"}
        </button>
        {msg && <p className="text-red-400">{msg}</p>}
      </form>
    </div>
  );
}
