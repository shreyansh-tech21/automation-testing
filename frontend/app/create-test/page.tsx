"use client";

import { useState } from "react";
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
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">
        Create No-Code Test
      </h1>

      {/* Basic Test Info */}
      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <div className="mb-4">
          <label className="block mb-1">Test Name</label>
          <input
            className="w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">URL</label>
          <input
            className="w-full border p-2 rounded"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">Profile</label>
          <select
            className="border p-2 rounded"
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
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Test Steps</h2>

        <button
          type="button"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-4 hover:bg-blue-700"
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
            className="grid grid-cols-6 gap-3 mb-4 border border-slate-200 p-4 rounded-lg"
          >
            <input
              placeholder="Label"
              className="border border-slate-300 p-2 rounded"
              value={step.label}
              onChange={(e) => {
                const updated = steps.map((s, i) =>
                  i === index ? { ...s, label: e.target.value } : s
                );
                setSteps(updated);
              }}
            />
            <select
              className="border border-slate-300 p-2 rounded"
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
              className="border border-slate-300 p-2 rounded"
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
              className="border border-slate-300 p-2 rounded"
              value={step.expected}
              onChange={(e) => {
                const updated = steps.map((s, i) =>
                  i === index ? { ...s, expected: e.target.value } : s
                );
                setSteps(updated);
              }}
            />
            <select
              className="border border-slate-300 p-2 rounded"
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
              className="bg-red-500 text-white rounded px-3 py-2 hover:bg-red-600"
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
          className="bg-green-600 text-white px-6 py-3 rounded-lg mt-6 hover:bg-green-700"
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
          className="bg-purple-600 text-white px-6 py-3 rounded-lg mt-4 ml-4 hover:bg-purple-700"
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