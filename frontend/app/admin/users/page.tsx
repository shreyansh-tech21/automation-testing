"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";

interface User {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
}

export default function AdminUsersPage() {
  useAuthGuard(["admin"]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get<User[]>("/users");
        setUsers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-400">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-slate-950">
      <Link
        href="/dashboard"
        className="text-slate-400 hover:text-slate-200 mb-6 inline-block transition"
      >
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Users (admin)</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-950/50 border border-red-800 text-red-200 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden">
        {users.length === 0 ? (
          <p className="p-6 text-slate-500 text-center">No users found.</p>
        ) : (
          <table className="w-full text-slate-200">
            <thead>
              <tr className="border-b border-slate-600 text-left">
                <th className="p-3 text-slate-300">Name</th>
                <th className="p-3 text-slate-300">Email</th>
                <th className="p-3 text-slate-300">Role</th>
                <th className="p-3 text-slate-300">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-slate-700">
                  <td className="p-3">{u.name ?? "—"}</td>
                  <td className="p-3">{u.email ?? "—"}</td>
                  <td className="p-3">{u.role ?? "—"}</td>
                  <td className="p-3 text-slate-400 text-sm">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
