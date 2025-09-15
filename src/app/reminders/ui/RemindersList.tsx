"use client";
import { useEffect, useState } from "react";

type R = {
  id: string; title: string; note?: string | null; dueAt: string; isDone: boolean;
};

export default function RemindersList() {
  const [items, setItems] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetch("/api/reminders").then(r => r.json()).then(setItems).finally(()=>setLoading(false));
  }, []);

  async function update(id: string, patch: Partial<R>) {
    await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } as R : i));
  }

  async function remove(id: string) {
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i.id !== id));
  }

  if (loading) return <div>Loading…</div>;

  return (
    <ul className="grid gap-3">
      {items.map(r => (
        <li key={r.id} className="rounded-lg border border-neutral-800 p-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={r.isDone}
              onChange={e => update(r.id, { isDone: e.target.checked })}
            />
            <input
              value={r.title}
              onChange={e => update(r.id, { title: e.target.value })}
              className="flex-1 bg-transparent outline-none"
            />
            <input
              type="datetime-local"
              value={toLocalInput(r.dueAt)}
              onChange={e => update(r.id, { dueAt: e.target.value })}
              className="bg-transparent"
            />
            <button onClick={() => remove(r.id)} className="text-red-400">Delete</button>
          </div>
          <textarea
            value={r.note ?? ""}
            onChange={e => update(r.id, { note: e.target.value })}
            className="mt-2 w-full bg-transparent outline-none border border-neutral-800 rounded-md p-2"
            placeholder="Notes…"
          />
        </li>
      ))}
    </ul>
  );
}

function toLocalInput(iso: string) {
  // ISO → yyyy-MM-ddTHH:mm for <input type=datetime-local>
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}
