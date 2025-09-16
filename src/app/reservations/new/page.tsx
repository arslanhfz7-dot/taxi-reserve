"use client";
import { useState } from "react";
import { localInputToUTC } from "@/lib/parseStartAt";

export default function NewReservation() {
  const [form, setForm] = useState({
    pickupText: "",
    dropoffText: "",
    startAt: "",
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

    // 1) Convert datetime-local -> UTC
    const utc = localInputToUTC(form.startAt);
    if (!utc) {
      setLoading(false);
      setMsg("Please provide a valid date & time.");
      return;
    }

    // 2) Normalize payload (numbers/nulls)
    const payload = {
      pickupText: form.pickupText || null,
      dropoffText: form.dropoffText || null,
      startAt: utc.toISOString(),                 // <-- UTC ISO
      pax: Number(form.pax) || 1,
      priceEuro: form.priceEuro ? Number(form.priceEuro) : null,
      phone: form.phone || null,                  // requires phone String? in Prisma
      flight: form.flight || null,                // requires flight String? in Prisma
      notes: form.notes ? form.notes.slice(0, 2000) : null,
    };

    // 3) Single POST
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

    // Optional: handle 401 redirect
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
      <h1 className="text-2xl font-semibold mb-4">New reservation</h1>
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
          <label className="block text-sm mb-1">Date & time</label>
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
          className="rounded-md border border-neutral-700 bg-neutral-900 p-2 min-h-[90px]"
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <button
          disabled={loading}
          className="rounded-md bg-white/10 px-4 py-2 hover:bg-white/20"
        >
          {loading ? "Saving..." : "Save"}
        </button>
        {msg && <p className="text-red-400">{msg}</p>}
      </form>
    </div>
  );
}
