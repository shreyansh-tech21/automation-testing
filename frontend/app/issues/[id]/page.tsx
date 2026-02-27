"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Issue } from "@/lib/types";
import { getIssueUserDisplay } from "@/lib/types";
import { useAuthGuard } from "@/lib/useAuthGuard";

const inputClass =
  "w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent";

export default function IssueDetail() {
  useAuthGuard();
  const { id } = useParams();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [instructions, setInstructions] = useState("");
  const [resolving, setResolving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fetchIssue = async () => {
    if (!id) return;
    try {
      const res = await api.get<Issue>(`/issues/${id}`);
      setIssue(res.data);
    } catch {
      setIssue(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setMessage(null);
    setResolving(true);
    try {
      const res = await api.put<Issue>(`/issues/${id}`, {
        instructions: instructions.trim() || undefined,
      });
      setIssue(res.data);
      setMessage({ type: "ok", text: "Issue resolved." });
    } catch {
      setMessage({ type: "err", text: "Failed to resolve." });
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-400">Loading issue...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen p-8 bg-slate-950">
        <Link href="/issues" className="text-slate-400 hover:text-slate-200 mb-4 inline-block">← Issues</Link>
        <p className="text-slate-400">Issue not found.</p>
      </div>
    );
  }

  const isOpen = !issue.isResolved;

  return (
    <div className="min-h-screen p-8 bg-slate-950">
      <Link href="/issues" className="text-slate-400 hover:text-slate-200 mb-6 inline-block transition">
        ← Issues
      </Link>
      <h1 className="text-2xl font-bold text-slate-100 mb-4">{issue.title}</h1>
      {issue.description && (
        <p className="mb-6 text-slate-300">{issue.description}</p>
      )}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-6 shadow-xl max-w-2xl mb-6">
        <p className="text-slate-400 text-sm mb-1">Status</p>
        <p className={`mb-4 font-medium ${issue.isResolved ? "text-emerald-400" : "text-slate-200"}`}>
          {issue.isResolved ? "Resolved" : "Open"}
        </p>
        <p className="text-slate-400 text-sm mb-1">Priority</p>
        <p className="text-slate-200 mb-4">{issue.priority ?? "—"}</p>
        <p className="text-slate-400 text-sm mb-1">Assigned to</p>
        <p className="text-slate-200 mb-4">{getIssueUserDisplay(issue.assignedTo)}</p>
        <p className="text-slate-400 text-sm mb-1">Linked execution</p>
        <p className="text-slate-200">
          {typeof issue.linkedExecutionId === "object" && issue.linkedExecutionId?.testName
            ? issue.linkedExecutionId.testName
            : issue.linkedExecutionId
              ? "Linked"
              : "—"}
        </p>
      </div>

      {isOpen ? (
        <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-6 shadow-xl max-w-2xl">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">Resolve issue</h2>
          <p className="text-slate-400 text-sm mb-4">
            Document the test steps that make the test run successfully. Saving will mark the issue as resolved.
          </p>
          <form onSubmit={handleResolve} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Test steps for successful running (instructions)
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. 1. Use correct credentials  2. Wait for element before click  3. Re-run test"
                rows={6}
                className={`${inputClass} resize-y min-h-[120px]`}
              />
            </div>
            {message && (
              <p className={message.type === "ok" ? "text-emerald-400 text-sm" : "text-red-400 text-sm"}>
                {message.text}
              </p>
            )}
            <button
              type="submit"
              disabled={resolving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition text-sm font-medium"
            >
              {resolving ? "Resolving..." : "Resolve issue"}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-6 shadow-xl max-w-2xl">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">Resolution</h2>
          <p className="text-slate-400 text-sm mb-1">Status: Resolved</p>
          {issue.resolutionInstructions && (
            <>
              <p className="text-slate-400 text-sm mb-1 mt-4">Resolution instructions</p>
              <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans bg-slate-900/50 rounded-lg p-4">
                {issue.resolutionInstructions}
              </pre>
            </>
          )}
          {issue.resolvedAt && (
            <p className="text-slate-500 text-xs mt-3">
              Resolved {new Date(issue.resolvedAt).toLocaleString()}
              {issue.resolvedBy && typeof issue.resolvedBy === "object" && (
                <> by {getIssueUserDisplay(issue.resolvedBy)}</>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
