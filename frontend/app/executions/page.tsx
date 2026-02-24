"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

const API_BASE = "http://localhost:5000";

interface Execution {
  _id: string;
  testId?: string;
  testName?: string;
  profile?: string;
  overallStatus?: string;
  createdAt?: string;
}

export default function AllExecutionsPage() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState("all");

  useEffect(() => {
    const fetchExecutions = async () => {
      try {
        const res = await axios.get<Execution[]>(`${API_BASE}/executions`);
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading executions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <Link href="/dashboard" className="text-slate-600 hover:underline mb-4 inline-block">
          ← Dashboard
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <Link href="/dashboard" className="text-slate-600 hover:underline mb-6 inline-block">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">All Executions</h1>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-slate-700 font-medium">Filter by profile:</label>
        <select
          className="border border-slate-300 p-2 rounded-lg text-slate-800 bg-white"
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

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {filteredExecutions.length === 0 ? (
          <p className="p-6 text-slate-500 text-center">
            No executions found for this profile.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {filteredExecutions.map((exec) => (
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
