"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
} from "chart.js";

import { Pie, Bar, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement
);
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useAuthGuard } from "@/lib/useAuthGuard";

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#94a3b8" } },
  },
  scales: {
    x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } },
    y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } },
  },
};

interface StrategyItem {
  _id: string;
  count: number;
}

interface TrendItem {
  _id: string;
  count: number;
}

interface Stats {
  totalExecutions: number;
  passRate: string | number;
  totalHeals: number;
  strategyBreakdown: StrategyItem[];
  trend?: TrendItem[];
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
  useAuthGuard();
  const [stats, setStats] = useState<Stats | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState("all");

  const passedCount =
    stats?.totalExecutions != null && stats?.passRate != null
      ? Math.round((stats.totalExecutions * Number(stats.passRate)) / 100)
      : 0;
  const failedCount = (stats?.totalExecutions ?? 0) - passedCount;

  const passFailData = {
    labels: ["Passed", "Failed"],
    datasets: [
      {
        data: [passedCount, failedCount],
        backgroundColor: ["#22c55e", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  const healStrategyData = {
    labels: stats?.strategyBreakdown?.map((s) => s._id) ?? [],
    datasets: [
      {
        label: "Heal Count",
        data: stats?.strategyBreakdown?.map((s) => s.count) ?? [],
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };

  const trendData = {
    labels: stats?.trend?.map((t) => t._id) ?? [],
    datasets: [
      {
        label: "Executions",
        data: stats?.trend?.map((t) => t.count) ?? [],
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        fill: true,
        tension: 0.2,
      },
    ],
  };

  const filteredExecutions =
    selectedProfile === "all"
      ? executions
      : executions.filter(
          (e) => e.profile?.toLowerCase() === selectedProfile.toLowerCase()
        );

  useEffect(() => {
    const fetchData = async () => {
      if (!getToken()) return;
      try {
        const [statsRes, execRes] = await Promise.all([
          api.get<Stats>("/stats"),
          api.get<Execution[]>("/executions"),
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-slate-950">
        <Link href="/" className="text-slate-400 hover:text-slate-200 mb-4 inline-block">
          ← Back
        </Link>
        <div className="bg-red-950/50 border border-red-800 text-red-200 rounded-xl p-4">
          <p className="font-medium">Error</p>
          <p>{error}</p>
          <p className="mt-2 text-sm text-red-300">Ensure the backend is running on port 5000.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-slate-950">
      <Link href="/" className="text-slate-400 hover:text-slate-200 mb-6 inline-block transition">
        ← Home
      </Link>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Automated Testing Dashboard</h1>

      <select
        className="mb-6 border border-slate-600 bg-slate-800 text-slate-100 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500/50"
        value={selectedProfile}
        onChange={(e) => setSelectedProfile(e.target.value)}
      >
        <option value="all">All Profiles</option>
        <option value="smoke">Smoke</option>
        <option value="e2e">E2E</option>
        <option value="api">API</option>
      </select>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-5 shadow-lg">
            <p className="text-sm text-slate-400">Total Executions</p>
            <p className="text-2xl font-semibold text-slate-100">
              {stats.totalExecutions}
            </p>
          </div>
          <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-5 shadow-lg">
            <p className="text-sm text-slate-400">Pass Rate</p>
            <p className="text-2xl font-semibold text-slate-100">
              {stats.passRate}%
            </p>
          </div>
          <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-5 shadow-lg">
            <p className="text-sm text-slate-400">Total Heals</p>
            <p className="text-2xl font-semibold text-slate-100">
              {stats.totalHeals}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-slate-800/80 shadow-xl rounded-xl p-6 border border-slate-700">
          <h2 className="font-semibold text-slate-100 mb-4">Pass vs Fail</h2>
          <div className="h-64">
            <Pie data={passFailData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-slate-800/80 shadow-xl rounded-xl p-6 border border-slate-700">
          <h2 className="font-semibold text-slate-100 mb-4">Heal Strategy Usage</h2>
          <div className="h-64">
            <Bar data={healStrategyData} options={chartOptions} />
          </div>
        </div>
      </div>

      {stats?.trend && stats.trend.length > 0 && (
        <div className="bg-slate-800/80 shadow-xl rounded-xl p-6 mb-10 border border-slate-700">
          <h2 className="font-semibold text-slate-100 mb-4">Execution Trend</h2>
          <div className="h-64">
            <Line data={trendData} options={chartOptions} />
          </div>
        </div>
      )}

      {stats?.strategyBreakdown && stats.strategyBreakdown.length > 0 && (
        <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-4 mb-8">
          <h2 className="font-semibold text-slate-100 mb-2">Heal strategy breakdown</h2>
          <ul className="space-y-1 text-sm text-slate-300">
            {stats.strategyBreakdown.map((s) => (
              <li key={s._id}>
                {s._id}: {s.count}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-slate-800/80 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center flex-wrap gap-2">
          <h2 className="font-semibold text-slate-100">Recent executions</h2>
          <Link
            href="/executions"
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition"
          >
            View all executions →
          </Link>
        </div>
        {filteredExecutions.length === 0 ? (
          <p className="p-4 text-slate-500 text-sm">
            No executions for this profile.
          </p>
        ) : (
          <ul className="divide-y divide-slate-700">
            {filteredExecutions.slice(0, 10).map((exec) => (
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

      <div className="bg-slate-800/80 shadow-xl rounded-xl p-6 mt-8 border border-slate-700">
        <h3 className="font-semibold text-slate-100 mb-4">AI Analysis</h3>
        <button type="button" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-500 transition">
          Analyze with AI
        </button>
        <div className="mt-4 text-slate-400">
          AI output will appear here.
        </div>
      </div>
    </div>
  );
}
