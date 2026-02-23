"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

const API_BASE = "http://localhost:5000";

interface StrategyItem {
  _id: string;
  count: number;
}

interface Stats {
  totalExecutions: number;
  passRate: string | number;
  totalHeals: number;
  strategyBreakdown: StrategyItem[];
}

interface Execution {
  _id: string;
  testId?: string;
  testName?: string;
  profile?: string;
  overallStatus?: string;
  createdAt?: string;
  results?: unknown[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, execRes] = await Promise.all([
          axios.get<Stats>(`${API_BASE}/stats`),
          axios.get<Execution[]>(`${API_BASE}/executions`),
        ]);
        setStats(statsRes.data);
        setExecutions(Array.isArray(execRes.data) ? execRes.data : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <Link href="/" className="text-slate-600 hover:underline mb-4 inline-block">
          ← Back
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error</p>
          <p>{error}</p>
          <p className="mt-2 text-sm">Ensure the backend is running on port 5000.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <Link href="/" className="text-slate-600 hover:underline mb-6 inline-block">
        ← Home
      </Link>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Automated Testing Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total Executions</p>
            <p className="text-2xl font-semibold text-slate-800">
              {stats.totalExecutions}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-500">Pass Rate</p>
            <p className="text-2xl font-semibold text-slate-800">
              {stats.passRate}%
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total Heals</p>
            <p className="text-2xl font-semibold text-slate-800">
              {stats.totalHeals}
            </p>
          </div>
        </div>
      )}

      {stats?.strategyBreakdown && stats.strategyBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm mb-8">
          <h2 className="font-semibold text-slate-800 mb-2">Heal strategy breakdown</h2>
          <ul className="space-y-1 text-sm text-slate-600">
            {stats.strategyBreakdown.map((s) => (
              <li key={s._id}>
                {s._id}: {s.count}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <h2 className="font-semibold text-slate-800 p-4 border-b border-slate-200">
          Recent executions
        </h2>
        {executions.length === 0 ? (
          <p className="p-4 text-slate-500 text-sm">No executions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {executions.slice(0, 10).map((exec) => (
              <li key={exec._id}>
                <Link
                  href={`/execution/${exec._id}`}
                  className="p-4 flex justify-between items-center text-sm hover:bg-slate-50 block"
                >
                  <span className="text-slate-700">
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
                        ? "text-green-600 font-medium"
                        : exec.overallStatus === "Failed"
                          ? "text-red-600 font-medium"
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
