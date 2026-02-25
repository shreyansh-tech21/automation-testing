"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "tester" | "viewer">("tester");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", { name, email, password, role });
      router.replace("/login");
    } catch (err: unknown) {
      const res = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { error?: string; message?: string } } }).response?.data : undefined;
      setError(res?.error || res?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-950">
      <div className="w-full max-w-sm bg-slate-800/80 border border-slate-700 rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Create account</h1>
        <p className="text-slate-400 text-sm mb-6">
          Register as admin, tester, or viewer to try the app.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-slate-600 bg-slate-800 text-slate-100 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-600 bg-slate-800 text-slate-100 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500/50"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-slate-600 bg-slate-800 text-slate-100 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "tester" | "viewer")}
              className="w-full border border-slate-600 bg-slate-800 text-slate-100 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="viewer">Viewer (dashboard &amp; executions only)</option>
              <option value="tester">Tester (+ create/manage tests)</option>
              <option value="admin">Admin (+ user management)</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-semibold rounded-lg transition"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="mt-6 text-center text-slate-500 text-sm">
          <Link href="/login" className="text-slate-400 hover:text-slate-200">Sign in</Link>
          {" · "}
          <Link href="/" className="text-slate-400 hover:text-slate-200">Home</Link>
        </p>
      </div>
    </div>
  );
}
