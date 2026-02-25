"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, API_BASE } from "@/lib/api";
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
  const [execution, setExecution] = useState<Execution | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<{ stepIndex: number } | null>(null);

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

      <button
        onClick={analyzeWithAI}
        disabled={loadingAI}
        className="mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition"
      >
        {loadingAI ? "Analyzing..." : "Analyze with AI"}
      </button>

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
              const screenshotUrl = hasScreenshot ? `${API_BASE}/executions/${id}/steps/${index}/screenshot` : null;
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
                        <a
                          href={screenshotUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 text-sm"
                        >
                          Open in tab
                        </a>
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
        const url = hasScreenshot ? `${API_BASE}/executions/${id}/steps/${screenshotPreview.stepIndex}/screenshot` : null;
        if (!url) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setScreenshotPreview(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-auto rounded-xl border border-slate-600 bg-slate-900 p-2 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <p className="text-slate-400 text-sm mb-2">Failed step: {step?.label ?? screenshotPreview.stepIndex + 1}</p>
              <img src={url} alt="Step screenshot" className="max-w-full max-h-[85vh] rounded" />
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
    </div>
  );
}