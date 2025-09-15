"use client";
import { useState } from "react";

export default function SettingsPage() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) setMsg("Password changed successfully.");
    else setMsg((await res.json()).error || "Failed to change password.");
    setForm({ currentPassword: "", newPassword: "" });
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <form onSubmit={submit} className="grid gap-3">
        <input type="password" placeholder="Current password"
          value={form.currentPassword}
          onChange={e => setForm({ ...form, currentPassword: e.target.value })}
          className="rounded-md border border-neutral-700 bg-neutral-900 p-2" />
        <input type="password" placeholder="New password (min 8 chars)"
          value={form.newPassword}
          onChange={e => setForm({ ...form, newPassword: e.target.value })}
          className="rounded-md border border-neutral-700 bg-neutral-900 p-2" />
        <button className="rounded-md bg-white/10 px-4 py-2 hover:bg-white/20">Change password</button>
        {msg && <p className="text-sm text-neutral-300">{msg}</p>}
      </form>
    </div>
  );
}
