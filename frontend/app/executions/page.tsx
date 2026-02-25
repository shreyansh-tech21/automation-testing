"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";

interface Execution {
  _id: string;
  testId?: string;
  testName?: string;
  profile?: string;
  overallStatus?: string;
  createdAt?: string;
}

export default function AllExecutionsPage() {
  useAuthGuard();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState("all");

  useEffect(() => {
    const fetchExecutions = async () => {
      try {
        const res = await api.get<Execution[]>("/executions");
        setExecutions(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load executions"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchExecutions();
  }, []);

  const filteredExecutions =
    selectedProfile === "all"
      ? executions
      : executions.filter(
          (e) => e.profile?.toLowerCase() === selectedProfile.toLowerCase()
        );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-400">Loading executions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-slate-950">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-200 mb-4 inline-block">
          ← Dashboard
        </Link>
        <div className="bg-red-950/50 border border-red-800 text-red-200 rounded-xl p-4">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-slate-950">
      <Link href="/dashboard" className="text-slate-400 hover:text-slate-200 mb-6 inline-block transition">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">All Executions</h1>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-slate-300 font-medium">Filter by profile:</label>
        <select
          className="border border-slate-600 bg-slate-800 text-slate-100 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500/50"
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
        >
          <option value="all">All Profiles</option>
          <option value="smoke">Smoke</option>
          <option value="e2e">E2E</option>
          <option value="api">API</option>
        </select>
        <span className="text-slate-500 text-sm">
          Showing {filteredExecutions.length} execution{filteredExecutions.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="bg-slate-800/80 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
        {filteredExecutions.length === 0 ? (
          <p className="p-6 text-slate-500 text-center">
            No executions found for this profile.
          </p>
        ) : (
          <ul className="divide-y divide-slate-700">
            {filteredExecutions.map((exec) => (
              <li key={exec._id}>
                <Link
                  href={`/execution/${exec._id}`}
                  className="p-4 flex justify-between items-center text-sm hover:bg-slate-700/50 block transition"
                >
                  <span className="text-slate-300">
                    {[exec.profile, exec.testName ?? exec.testId ?? exec._id]
                      .filter(Boolean)
                      .join(" · ")}{" "}
                    ·{" "}
                    {exec.createdAt
                      ? new Date(exec.createdAt).toLocaleString()
                      : "—"}
                  </span>
                  <span
                    className={
                      exec.overallStatus === "Passed"
                        ? "text-emerald-400 font-medium"
                        : exec.overallStatus === "Failed"
                          ? "text-red-400 font-medium"
                          : "text-slate-500"
                    }
                  >
                    {exec.overallStatus ?? "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
