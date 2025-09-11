"use client";
import { useState } from "react";

export default function NewReservation() {
  const [form, setForm] = useState({
    pickupText: "",
    dropoffText: "",
    startAt: "",
    pax: 1,
    priceEuro: "",
    notes: "",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (res.ok) {
      window.location.href = "/reservations";
    } else if (res.status === 401) {
      setMsg("Please log in first.");
      window.location.href = "/login";
    } else {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error || "Error creating reservation");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">New reservation</h1>
      <form onSubmit={submit} className="grid gap-3">
        <input className="border p-2" placeholder="Pickup address"
          value={form.pickupText} onChange={e=>setForm({ ...form, pickupText: e.target.value })}/>
        <input className="border p-2" placeholder="Drop-off address"
          value={form.dropoffText} onChange={e=>setForm({ ...form, dropoffText: e.target.value })}/>
        <label className="text-sm text-gray-400">Date & time</label>
        <input className="border p-2" type="datetime-local"
          value={form.startAt} onChange={e=>setForm({ ...form, startAt: e.target.value })}/>
        <input className="border p-2" type="number" min={1} placeholder="Passengers"
          value={form.pax} onChange={e=>setForm({ ...form, pax: Number(e.target.value) })}/>
        <input className="border p-2" type="number" step="0.01" placeholder="Price (EUR)"
          value={form.priceEuro} onChange={e=>setForm({ ...form, priceEuro: e.target.value })}/>
        <textarea className="border p-2" placeholder="Notes"
          value={form.notes} onChange={e=>setForm({ ...form, notes: e.target.value })}/>
        <button disabled={loading} className="bg-black text-white p-2 rounded">
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
      {msg && <p className="mt-3 text-red-500">{msg}</p>}
    </div>
  );
}
