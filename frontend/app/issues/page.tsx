"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Issue } from "@/lib/types";
import { getIssueUserDisplay } from "@/lib/types";
import { useAuthGuard } from "@/lib/useAuthGuard";

export default function IssuesPage() {
  useAuthGuard();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab,setActiveTab] = useState("open");

  const fetchIssues = useCallback(async (tab: string) => {
    setLoading(true);
    try {
      if (tab === "my-resolutions") {
        const res = await api.get<Issue[]>("/issues/my-resolved");
        setIssues(res.data ?? []);
      } else {
        const res = await api.get<Issue[]>(`/issues`, {
          params: tab ? { status: tab } : {},
        });
        setIssues(res.data ?? []);
      }
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues(activeTab);
  }, [fetchIssues, activeTab]);

  useEffect(() => {
    const onFocus = () => fetchIssues(activeTab);
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [fetchIssues, activeTab]);

  const getPriorityClass = (p?: string) => {
    if (p === "high") return "text-red-400 bg-red-950/50 px-2 py-0.5 rounded text-xs font-medium";
    if (p === "medium") return "text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded text-xs font-medium";
    return "text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded text-xs font-medium";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-400">Loading issues...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-slate-950">
      <Link href="/" className="text-slate-400 hover:text-slate-200 mb-6 inline-block transition">
        ← Home
      </Link>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Issues</h1>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("open")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "open" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"}`}
        >
          Open
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("resolved")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "resolved" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"}`}
        >
          Resolved
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("my-resolutions")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "my-resolutions" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"}`}
        >
          My resolutions
        </button>
      </div>

      <div className="bg-slate-800/80 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
        {issues.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-300 font-medium text-lg mb-1">
              {activeTab === "open"
                ? "No open issues"
                : activeTab === "resolved"
                  ? "No resolved issues"
                  : "No resolved issues"}
            </p>
            <p className="text-slate-500 text-sm">
              {activeTab === "open"
                ? "There are no open issues. Create one from a failed execution (execution detail → Create Issue)."
                : activeTab === "my-resolutions"
                  ? "Issues you created and that were resolved will appear here."
                  : "Resolved issues will appear here."}
            </p>
          </div>
        ) : activeTab === "my-resolutions" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="p-4 text-slate-400 text-sm font-medium">Issue title</th>
                  <th className="p-4 text-slate-400 text-sm font-medium">Resolved at</th>
                  <th className="p-4 text-slate-400 text-sm font-medium">Resolver</th>
                  <th className="p-4 text-slate-400 text-sm font-medium">Resolution instructions</th>
                  <th className="p-4 text-slate-400 text-sm font-medium">Linked execution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {issues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-slate-700/50 transition">
                    <td className="p-4 text-slate-200 font-medium">{issue.title}</td>
                    <td className="p-4 text-slate-300 text-sm">
                      {issue.resolvedAt
                        ? new Date(issue.resolvedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-4 text-slate-300 text-sm">
                      {getIssueUserDisplay(issue.resolvedBy)}
                    </td>
                    <td className="p-4 text-slate-300 text-sm max-w-md">
                      {issue.resolutionInstructions ? (
                        <pre className="whitespace-pre-wrap font-sans text-sm">
                          {issue.resolutionInstructions}
                        </pre>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-4 text-slate-300 text-sm">
                      {typeof issue.linkedExecutionId === "object" && issue.linkedExecutionId?.testName
                        ? issue.linkedExecutionId.testName
                        : issue.linkedExecutionId
                          ? "Linked"
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="p-4 text-slate-400 text-sm font-medium">Title</th>
                  <th className="p-4 text-slate-400 text-sm font-medium">Status</th>
                  <th className="p-4 text-slate-400 text-sm font-medium">Priority</th>
                  <th className="p-4 text-slate-400 text-sm font-medium">Assigned</th>
                  <th className="p-4 text-slate-400 text-sm font-medium">Execution</th>
                  <th className="p-4 text-slate-400 text-sm font-medium w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {issues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-slate-700/50 transition">
                    <td className="p-4">
                      <Link
                        href={`/issues/${issue._id}`}
                        className="text-slate-200 hover:text-emerald-400 font-medium transition"
                      >
                        {issue.title}
                      </Link>
                    </td>
                    <td className="p-4">
                      <span
                        className={
                          issue.isResolved
                            ? "text-emerald-400 font-semibold"
                            : "text-red-400 font-medium"
                        }
                      >
                        {issue.isResolved ? "Resolved" : "Open"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={getPriorityClass(issue.priority)}>
                        {issue.priority ?? "—"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 text-sm">{getIssueUserDisplay(issue.assignedTo)}</td>
                    <td className="p-4 text-slate-300 text-sm">
                      {typeof issue.linkedExecutionId === "object" && issue.linkedExecutionId?.testName
                        ? issue.linkedExecutionId.testName
                        : issue.linkedExecutionId
                          ? "Linked"
                          : "—"}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/issues/${issue._id}`}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
