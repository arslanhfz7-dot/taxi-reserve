"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const r = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (r.ok) setMsg("Registered! You can log in now.");
    else {
      const j = await r.json().catch(() => ({}));
      setMsg(j.error || "Error registering");
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <input className="border p-2" placeholder="Name"
               value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
        <input className="border p-2" placeholder="Email"
               value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
        <input className="border p-2" type="password" placeholder="Password"
               value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
        <button className="bg-black text-white p-2 rounded">Register</button>
      </form>
      {msg && <p className="mt-3">{msg}</p>}
    </div>
  );
}
