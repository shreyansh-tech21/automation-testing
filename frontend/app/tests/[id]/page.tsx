"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "next/navigation";

export default function TestDetail() {
  const { id } = useParams();
  const [test, setTest] = useState<{ name?: string; steps?: { name?: string; url?: string }[] } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    if (!id || !token) return;
    axios
      .get(`http://localhost:5000/tests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setTest(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  if (!test) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      {test.name && <h1 className="text-xl font-semibold mb-4">{test.name}</h1>}
      {test.steps?.map((step, index) => (
        <div key={index} className="border p-4 mb-4 rounded bg-gray-50">
          <input
            value={step.name ?? ""}
            className="border p-2 w-full mb-2"
            placeholder="Step name"
            onChange={(e) => {
              const updated = [...(test.steps ?? [])];
              updated[index] = { ...updated[index], name: e.target.value };
              setTest({ ...test, steps: updated });
            }}
          />
          <input
            value={step.url ?? ""}
            className="border p-2 w-full mb-2"
            placeholder="URL"
            onChange={(e) => {
              const updated = [...(test.steps ?? [])];
              updated[index] = { ...updated[index], url: e.target.value };
              setTest({ ...test, steps: updated });
            }}
          />
        </div>
      ))}
    </div>
  );
}