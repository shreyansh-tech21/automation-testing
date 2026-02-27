"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";

interface StepResult {
  label?: string;
  status?: string;
  error?: string;
  screenshot?: string;
  healed?: boolean;
  healStrategy?: string;
  similarityScore?: number;
}

interface Execution {
  _id: string;
  testId?: string;
  testName?: string;
  profile?: string;
  overallStatus?: string;
  createdAt?: string;
  results?: StepResult[];
}

interface AIAnalysis {
  summary?: string;
  rootCause?: string;
  flakyLikelihood?: string;
  suggestion?: string;
}

export default function ExecutionDetail() {
  useAuthGuard();
  const { id } = useParams();
  const router = useRouter();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<{ stepIndex: number } | null>(null);
  const [screenshotBlobUrl, setScreenshotBlobUrl] = useState<string | null>(null);
  const [screenshotLoadError, setScreenshotLoadError] = useState<string | null>(null);
  const [openInTabLoading, setOpenInTabLoading] = useState<number | null>(null); // stepIndex when loading
  const screenshotBlobUrlRef = useRef<string | null>(null);
  const [showIssueForm, setShowIssueForm] = useState(false);

  // Load screenshot with auth when preview is opened (browser doesn't send Bearer for <img src>)
  useEffect(() => {
    if (!id || !execution || screenshotPreview == null) {
      screenshotBlobUrlRef.current = null;
      setScreenshotBlobUrl(null);
      setScreenshotLoadError(null);
      return;
    }
    const stepIndex = screenshotPreview.stepIndex;
    const step = execution.results?.[stepIndex];
    const hasScreenshot = step?.status === "Failed" && step?.screenshot && !step.screenshot.startsWith("(");
    if (!hasScreenshot) return;

    setScreenshotLoadError(null);
    api
      .get(`/executions/${id}/steps/${stepIndex}/screenshot`, { responseType: "blob" })
      .then((res) => {
        const url = URL.createObjectURL(res.data as Blob);
        screenshotBlobUrlRef.current = url;
        setScreenshotBlobUrl(url);
      })
      .catch(() => {
        setScreenshotLoadError("Failed to load screenshot");
        setScreenshotBlobUrl(null);
      });

    return () => {
      if (screenshotBlobUrlRef.current) {
        URL.revokeObjectURL(screenshotBlobUrlRef.current);
        screenshotBlobUrlRef.current = null;
      }
      setScreenshotBlobUrl(null);
    };
  }, [id, execution, screenshotPreview]);

  const openScreenshotInNewTab = async (stepIndex: number) => {
    setOpenInTabLoading(stepIndex);
    try {
      const res = await api.get(`/executions/${id}/steps/${stepIndex}/screenshot`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data as Blob);
      window.open(url, "_blank");
      // Don't revoke so the new tab can display the image
    } catch {
      setOpenInTabLoading(null);
    }
    setOpenInTabLoading(null);
  };

  const analyzeWithAI = async () => {
    setLoadingAI(true);
    try {
      const res = await api.post<AIAnalysis>(`/ai/analyze/${id}`);
      setAiAnalysis(res.data);
    } catch (err) {
      console.error("AI analysis error:", err);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const res = await api.get(`/executions/${id}`);
      setExecution(res.data);
    };
    fetchData();
  }, [id]);

  if (!execution) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <Link href="/dashboard" className="text-slate-400 hover:text-slate-200 mb-4 inline-block transition">
        ← Dashboard
      </Link>
      <h2 className="text-2xl font-bold text-slate-100 mb-2">
        {execution.testName}
      </h2>
      {execution.profile && (
        <p className="text-slate-400 text-sm mb-4">Profile: {execution.profile}</p>
      )}
      <p
        className={
          execution.overallStatus === "Passed"
            ? "text-emerald-400 font-medium"
            : "text-red-400 font-medium"
        }
      >
        {execution.overallStatus}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={analyzeWithAI}
          disabled={loadingAI}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition"
        >
          {loadingAI ? "Analyzing..." : "Analyze with AI"}
        </button>
        {execution.overallStatus === "Failed" && (
          <button
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition"
            onClick={() => setShowIssueForm(true)}
          >
            Create Issue
          </button>
        )}
      </div>

      {aiAnalysis && (
        <div className="mt-6 bg-slate-800/80 border border-slate-700 p-6 rounded-xl">
          <h3 className="text-slate-200 font-semibold mb-2">Summary</h3>
          <p className="text-slate-300">{aiAnalysis.summary}</p>

          <h3 className="text-slate-200 font-semibold mt-4 mb-2">Root Cause</h3>
          <p className="text-slate-300">{aiAnalysis.rootCause}</p>

          <h3 className="text-slate-200 font-semibold mt-4 mb-2">Flaky Likelihood</h3>
          <p className="text-slate-300">{aiAnalysis.flakyLikelihood}</p>

          <h3 className="text-slate-200 font-semibold mt-4 mb-2">Suggestion</h3>
          <p className="text-slate-300">{aiAnalysis.suggestion}</p>
        </div>
      )}

      <div className="bg-slate-800/80 border border-slate-700 shadow-xl rounded-xl p-6 mt-6 overflow-x-auto">
        <table className="w-full text-slate-200">
          <thead>
            <tr className="border-b border-slate-600 text-left">
              <th className="pb-3 pr-4 text-slate-300">Step</th>
              <th className="pb-3 pr-4 text-slate-300">Status</th>
              <th className="pb-3 pr-4 text-slate-300">Healed</th>
              <th className="pb-3 pr-4 text-slate-300">Strategy</th>
              <th className="pb-3 pr-4 text-slate-300">Score</th>
              <th className="pb-3 pr-4 text-slate-300">Error</th>
              <th className="pb-3 text-slate-300">Screenshot</th>
            </tr>
          </thead>
          <tbody>
            {(execution.results ?? []).map((step, index) => {
              const hasScreenshot = step.status === "Failed" && step.screenshot && !step.screenshot.startsWith("(");
              return (
                <tr key={index} className="border-b border-slate-700">
                  <td className="py-3 pr-4">{step.label}</td>
                  <td className="py-3 pr-4">{step.status}</td>
                  <td className="py-3 pr-4">{step.healed ? "Yes" : "No"}</td>
                  <td className="py-3 pr-4">{step.healStrategy || "-"}</td>
                  <td className="py-3 pr-4">{step.similarityScore ?? "-"}</td>
                  <td className="py-3 text-red-400 max-w-xs truncate" title={step.error}>{step.error || "-"}</td>
                  <td className="py-3 pr-4">
                    {hasScreenshot ? (
                      <span className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openScreenshotInNewTab(index)}
                          disabled={openInTabLoading === index}
                          className="text-indigo-400 hover:text-indigo-300 text-sm disabled:opacity-50"
                        >
                          {openInTabLoading === index ? "Loading…" : "Open in tab"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setScreenshotPreview(screenshotPreview?.stepIndex === index ? null : { stepIndex: index })}
                          className="text-slate-400 hover:text-slate-200 text-sm"
                        >
                          {screenshotPreview?.stepIndex === index ? "Hide" : "Preview"}
                        </button>
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {screenshotPreview != null && (() => {
        const step = execution.results?.[screenshotPreview.stepIndex];
        const hasScreenshot = step?.status === "Failed" && step?.screenshot && !step.screenshot.startsWith("(");
        if (!hasScreenshot) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setScreenshotPreview(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-auto rounded-xl border border-slate-600 bg-slate-900 p-2 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <p className="text-slate-400 text-sm mb-2">Failed step: {step?.label ?? screenshotPreview.stepIndex + 1}</p>
              {screenshotLoadError && <p className="text-red-400 text-sm mb-2">{screenshotLoadError}</p>}
              {screenshotBlobUrl ? (
                <img src={screenshotBlobUrl} alt="Step screenshot" className="max-w-full max-h-[85vh] rounded" />
              ) : (
                <p className="text-slate-400 py-8">Loading screenshot…</p>
              )}
              <button
                type="button"
                onClick={() => setScreenshotPreview(null)}
                className="mt-2 w-full py-1.5 text-slate-300 hover:text-white bg-slate-700 rounded"
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}

      {showIssueForm && (
        <IssueFormModal
          executionId={id as string}
          executionName={execution.testName}
          onClose={() => setShowIssueForm(false)}
          onSuccess={() => {
            setShowIssueForm(false);
            router.push("/issues");
          }}
        />
      )}
    </div>
  );
}

interface AssignableUser {
  _id: string;
  name?: string;
  email?: string;
}

function IssueFormModal({
  executionId,
  executionName,
  onClose,
  onSuccess,
}: {
  executionId: string;
  executionName?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<AssignableUser[]>("/users/assignable").then((res) => setAssignableUsers(res.data ?? [])).catch(() => setAssignableUsers([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/issues", {
        title: title || `Failed: ${executionName ?? executionId}`,
        description: description || undefined,
        priority,
        linkedExecutionId: executionId,
        ...(assignedTo ? { assignedTo } : {}),
      });
      onSuccess();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : "Failed to create issue";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-600 bg-slate-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Create Issue</h3>
        <p className="text-slate-400 text-sm mb-4">Linked to execution: {executionName ?? executionId}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Failed: ${executionName ?? "Execution"}`}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the failure..."
              className="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Assigned To</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">— Unassigned —</option>
              {assignableUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name || u.email || u._id}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white bg-slate-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg transition"
            >
              {submitting ? "Creating..." : "Create Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}