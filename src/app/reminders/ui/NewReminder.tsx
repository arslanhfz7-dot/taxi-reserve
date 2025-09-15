"use client";
import { useState } from "react";

export default function NewReminder() {
  const [form, setForm] = useState({ title: "", note: "", dueAt: "" });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", note: "", dueAt: "" });
    setLoading(false);
    location.reload(); // simplest stable refresh for now
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <input
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        placeholder="Title"
        className="rounded-md border border-neutral-700 bg-neutral-900 p-2"
        required
      />
      <textarea
        value={form.note}
        onChange={e => setForm({ ...form, note: e.target.value })}
        placeholder="Notes (optional)"
        className="rounded-md border border-neutral-700 bg-neutral-900 p-2 min-h-[80px]"
      />
      <input
        type="datetime-local"
        value={form.dueAt}
        onChange={e => setForm({ ...form, dueAt: e.target.value })}
        className="rounded-md border border-neutral-700 bg-neutral-900 p-2"
        required
      />
      <button
        disabled={loading}
        className="rounded-md bg-white/10 px-4 py-2 hover:bg-white/20"
      >
        {loading ? "Saving..." : "Save reminder"}
      </button>
    </form>
  );
}
