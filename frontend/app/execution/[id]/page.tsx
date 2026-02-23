"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

interface StepResult {
  label?: string;
  status?: string;
  error?: string;
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

export default function ExecutionDetail() {
  const { id } = useParams();
  const [execution, setExecution] = useState<Execution | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await axios.get(
      `http://localhost:5000/executions/${id}`
    );
    setExecution(res.data);
  };

  if (!execution) return <div>Loading...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">
        {execution.testName}
      </h2>

      <p className={
        execution.overallStatus === "Passed"
          ? "text-green-600"
          : "text-red-600"
      }>
        {execution.overallStatus}
      </p>

      <div className="bg-white shadow rounded-xl p-6 mt-6">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left">
              <th>Step</th>
              <th>Status</th>
              <th>Healed</th>
              <th>Strategy</th>
              <th>Score</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {(execution.results ?? []).map((step, index) => (
              <tr key={index} className="border-b">
                <td>{step.label}</td>
                <td>{step.status}</td>
                <td>{step.healed ? "Yes" : "No"}</td>
                <td>{step.healStrategy || "-"}</td>
                <td>{step.similarityScore || "-"}</td>
                <td className="text-red-600">
                  {step.error || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}