"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { setAuth, getToken, getRole } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) {
      const role = getRole();
      router.replace(role === "admin" ? "/admin/users" : "/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post<{ token: string; role: string }>("/auth/login", {
        email,
        password,
      });
      setAuth(data.token, data.role);
      if (data.role === "admin") {
        router.replace("/admin/users");
      } else {
        router.replace("/dashboard");
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Login failed";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-950">
      <div className="w-full max-w-sm bg-slate-800/80 border border-slate-700 rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Sign in</h1>
        <p className="text-slate-400 text-sm mb-6">
          Use your email and password to access the app.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full border border-slate-600 bg-slate-800 text-slate-100 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-semibold rounded-lg transition"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-slate-500 text-sm">
          <Link href="/" className="text-slate-400 hover:text-slate-200">← Home</Link>
          {" · "}
          <Link href="/register" className="text-slate-400 hover:text-slate-200">Create account</Link>
        </p>
      </div>
    </div>
  );
}
