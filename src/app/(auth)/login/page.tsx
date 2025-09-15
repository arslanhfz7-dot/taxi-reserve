"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    const res = await signIn("credentials", {
      email, password,
      redirect: false, // stay here
    });

    if (res?.ok) {
      // Force rerender of server components that read session + navigate
      router.push("/reservations");
      router.refresh();
    } else {
      setError("Invalid email or password");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-sm mx-auto p-6">
      <input name="email" placeholder="Email" className="rounded-md p-2 bg-neutral-900 border border-neutral-700" />
      <input name="password" type="password" placeholder="Password" className="rounded-md p-2 bg-neutral-900 border border-neutral-700" />
      {error && <p className="text-red-400">{error}</p>}
      <button className="rounded-md bg-white/10 px-4 py-2 hover:bg-white/20">Sign in</button>
    </form>
  );
}
