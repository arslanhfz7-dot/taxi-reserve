"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,                 // <— key change: don’t auto-redirect
    });

    setLoading(false);

    if (res?.error) {
      setMsg(res.error || "Login failed");
      return;
    }
    // success
    router.push("/reservations");
  };

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <input className="border p-2" placeholder="Email"
               value={form.email} onChange={e=>setForm({...form, email: e.target.value})}/>
        <input className="border p-2" type="password" placeholder="Password"
               value={form.password} onChange={e=>setForm({...form, password: e.target.value})}/>
        <button className="bg-black text-white p-2 rounded" disabled={loading}>
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>
      {msg && <p className="mt-3 text-red-500">{msg}</p>}
      <p className="mt-3 text-sm">
        Session check: <a className="underline" href="/api/auth/session">/api/auth/session</a>
      </p>
    </div>
  );
}
