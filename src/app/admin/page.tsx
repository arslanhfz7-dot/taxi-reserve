"use client";

import { useState } from "react";

type User = {
  id: string;
  email: string;
  name?: string | null;
  createdAt: string;
};

type AdminData = {
  count: number;
  users: User[];
};

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function login() {
    setError(null);
    setMsg(null);
    setLoading(true);

    const res = await fetch("/api/admin?pw=" + encodeURIComponent(pw));
    setLoading(false);

    if (res.ok) {
      const j: AdminData = await res.json();
      setData(j);
    } else {
      setError("Wrong password or unauthorized");
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    setLoading(true);
    setMsg(null);
    setError(null);

    const res = await fetch(
      `/api/admin?pw=${encodeURIComponent(pw)}&id=${id}`,
      { method: "DELETE" }
    );

    setLoading(false);

    if (res.ok) {
      setMsg("User deleted successfully.");
      login(); // refresh list
    } else {
      setError("Failed to delete user.");
    }
  }

  // If not logged in yet
  if (!data) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-4">Admin Login</h1>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Enter admin password"
          className="border px-3 py-2 w-full mb-2 rounded"
        />
        <button
          onClick={login}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Loading..." : "Login"}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  // If logged in, show user table
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Admin Panel</h1>

      {msg && <p className="text-green-600 mb-2">{msg}</p>}
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <p className="mb-4 font-medium">Total users: {data.count}</p>

      <div className="overflow-x-auto">
        <table className="border w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border text-left">Email</th>
              <th className="p-2 border text-left">Name</th>
              <th className="p-2 border text-left">Created At</th>
              <th className="p-2 border text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((u) => (
              <tr key={u.id}>
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border">{u.name || "-"}</td>
                <td className="p-2 border">
                  {new Date(u.createdAt).toLocaleString()}
                </td>
                <td className="p-2 border">
                  <button
                    onClick={() => deleteUser(u.id)}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    {loading ? "..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {data.users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
