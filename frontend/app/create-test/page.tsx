"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";

interface Step {
  label: string;
  action: string;
  value: string;
  expected: string;
  type: string;
}

export default function CreateTest() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [profile, setProfile] = useState("smoke");
  const [steps, setSteps] = useState<Step[]>([]);

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <Link href="/" className="text-slate-400 hover:text-slate-200 mb-6 inline-block transition">← Home</Link>
      <h1 className="text-3xl font-bold text-slate-100 mb-6">
        Create No-Code Test
      </h1>

      {/* Basic Test Info */}
      <div className="bg-slate-800/80 border border-slate-700 shadow-xl rounded-xl p-6 mb-6">
        <div className="mb-4">
          <label className="block mb-1 text-slate-300">Test Name</label>
          <input
            className="w-full border border-slate-600 bg-slate-800 text-slate-100 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500/50"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-slate-300">URL</label>
          <input
            className="w-full border border-slate-600 bg-slate-800 text-slate-100 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500/50"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1 text-slate-300">Profile</label>
          <select
            className="border border-slate-600 bg-slate-800 text-slate-100 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500/50"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
          >
            <option value="smoke">Smoke</option>
            <option value="e2e">E2E</option>
            <option value="api">API</option>
          </select>
        </div>
      </div>

      {/* Steps Section */}
      <div className="bg-slate-800/80 border border-slate-700 shadow-xl rounded-xl p-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Test Steps</h2>

        <button
          type="button"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg mb-4 hover:bg-emerald-500 transition"
          onClick={() =>
            setSteps([
              ...steps,
              {
                label: "",
                action: "fill",
                value: "",
                expected: "",
                type: "positive",
              },
            ])
          }
        >
          + Add Step
        </button>

        {steps.length === 0 ? (
          <p className="text-slate-500 text-sm">No steps yet. Click &quot;+ Add Step&quot; to add one.</p>
        ) : null}

        {steps.map((step, index) => (
          <div
            key={index}
            className="grid grid-cols-6 gap-3 mb-4 border border-slate-600 bg-slate-800/50 p-4 rounded-lg"
          >
            <input
              placeholder="Label"
              className="border border-slate-600 bg-slate-800 text-slate-100 p-2 rounded-lg placeholder-slate-500"
              value={step.label}
              onChange={(e) => {
                const updated = steps.map((s, i) =>
                  i === index ? { ...s, label: e.target.value } : s
                );
                setSteps(updated);
              }}
            />
            <select
              className="border border-slate-600 bg-slate-800 text-slate-100 p-2 rounded-lg"
              value={step.action}
              onChange={(e) => {
                const updated = steps.map((s, i) =>
                  i === index ? { ...s, action: e.target.value } : s
                );
                setSteps(updated);
              }}
            >
              <option value="fill">Fill</option>
              <option value="click">Click</option>
            </select>
            <input
              placeholder="Value"
              className="border border-slate-600 bg-slate-800 text-slate-100 p-2 rounded-lg placeholder-slate-500"
              value={step.value}
              onChange={(e) => {
                const updated = steps.map((s, i) =>
                  i === index ? { ...s, value: e.target.value } : s
                );
                setSteps(updated);
              }}
            />
            <input
              placeholder="Expected"
              className="border border-slate-600 bg-slate-800 text-slate-100 p-2 rounded-lg placeholder-slate-500"
              value={step.expected}
              onChange={(e) => {
                const updated = steps.map((s, i) =>
                  i === index ? { ...s, expected: e.target.value } : s
                );
                setSteps(updated);
              }}
            />
            <select
              className="border border-slate-600 bg-slate-800 text-slate-100 p-2 rounded-lg"
              value={step.type}
              onChange={(e) => {
                const updated = steps.map((s, i) =>
                  i === index ? { ...s, type: e.target.value } : s
                );
                setSteps(updated);
              }}
            >
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
            </select>
            <button
              type="button"
              className="bg-red-600 text-white rounded-lg px-3 py-2 hover:bg-red-500 transition"
              onClick={() => {
                setSteps(steps.filter((_, i) => i !== index));
              }}
            >
              X
            </button>
          </div>
        ))}

        <button
          type="button"
          className="bg-emerald-600 text-white px-6 py-3 rounded-lg mt-6 hover:bg-emerald-500 transition"
          onClick={async () => {
            try {
              const res = await axios.post(
                "http://localhost:5000/create-test",
                {
                  name,
                  url,
                  profile,
                  steps,
                }
              );
              alert("Test saved successfully!");
            } catch (err) {
              alert("Error saving test");
            }
          }}
        >
          Save Test
        </button>

        <button
          type="button"
          className="bg-violet-600 text-white px-6 py-3 rounded-lg mt-4 ml-4 hover:bg-violet-500 transition"
          onClick={async () => {
            try {
              const createRes = await axios.post(
                "http://localhost:5000/create-test",
                { name, url, profile, steps }
              );
              const id = createRes.data._id;
              await axios.post(`http://localhost:5000/run-test/${id}`);
              alert("Test executed!");
            } catch (err) {
              alert("Error running test");
            }
          }}
        >
          Save & Run
        </button>
      </div>
    </div>
  );
}