"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";

interface Test {
  _id: string;
  name?: string;
  url?: string;
  profile?: string;
}

export default function TestsPage() {
  useAuthGuard(["admin", "tester"]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTests = async () => {
    try {
      const res = await api.get<Test[]>("/tests");
      setTests(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const filteredTests =
    selectedProfile === "all"
      ? tests
      : tests.filter(
          (t) => t.profile?.toLowerCase() === selectedProfile.toLowerCase()
        );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this test? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.delete(`/tests/${id}`);
      await fetchTests();
    } catch (err) {
      console.error(err);
      alert("Failed to delete test");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-400">Loading tests...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-slate-950">
      <Link
        href="/"
        className="text-slate-400 hover:text-slate-200 mb-6 inline-block transition"
      >
        ← Home
      </Link>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Manage Tests</h1>
      <p className="text-slate-400 mb-4">
        Delete tests here. They will no longer run when you use /run in Slack or
        run by profile.
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-950/50 border border-red-800 text-red-200 rounded-xl">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-slate-300 font-medium">Profile:</label>
        <select
          className="border border-slate-600 bg-slate-800 text-slate-100 p-2 rounded-lg"
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
        >
          <option value="all">All</option>
          <option value="smoke">Smoke</option>
          <option value="e2e">E2E</option>
          <option value="api">API</option>
        </select>
        <span className="text-slate-500 text-sm">
          Showing {filteredTests.length} test{filteredTests.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden">
        {filteredTests.length === 0 ? (
          <p className="p-6 text-slate-500 text-center">
            No tests found for this profile.
          </p>
        ) : (
          <ul className="divide-y divide-slate-700">
            {filteredTests.map((test) => (
              <li
                key={test._id}
                className="p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <span className="text-slate-200 font-medium">
                    {test.name || "Unnamed"}
                  </span>
                  <span className="text-slate-500 text-sm ml-2">
                    {test.profile}
                  </span>
                  <p className="text-slate-400 text-sm mt-0.5 truncate max-w-md">
                    {test.url}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(test._id)}
                  disabled={deletingId === test._id}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-sm transition"
                >
                  {deletingId === test._id ? "Deleting..." : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
