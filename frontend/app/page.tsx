"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAuthenticated, getRole, clearAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const loggedIn = mounted && isAuthenticated();
  const role = mounted ? getRole() : null;

  const handleLogout = () => {
    clearAuth();
    router.replace("/");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-950">
      <h1 className="text-4xl font-bold text-slate-100 mb-3 tracking-tight">
        AutoTestIQ – AI-Driven End-to-End Test Automation Platform
      </h1>
      <p className="text-slate-400 mb-10 max-w-md text-center text-lg">
        Run and view test executions with self-healing locators.
      </p>
      {!mounted ? (
        <p className="text-slate-500">Loading...</p>
      ) : loggedIn ? (
        <>
          <Link
            href="/dashboard"
            className="px-8 py-3.5 bg-emerald-500 text-slate-950 rounded-xl font-semibold hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
          >
            Open Dashboard
          </Link>
          <div className="mt-12 flex flex-wrap gap-6 justify-center">
            <Link href="/executions" className="text-slate-400 hover:text-slate-200 text-sm transition">
              Executions
            </Link>
            {(role === "admin" || role === "tester") && (
              <>
                <Link href="/create-test" className="text-slate-400 hover:text-slate-200 text-sm transition">
                  Create Test
                </Link>
                <Link href="/tests" className="text-slate-400 hover:text-slate-200 text-sm transition">
                  Manage Tests
                </Link>
              </>
            )}
            {role === "admin" && (
              <Link href="/admin/users" className="text-slate-400 hover:text-slate-200 text-sm transition">
                Admin · Users
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="text-slate-500 hover:text-slate-300 text-sm transition"
            >
              Log out
            </button>
          </div>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="px-8 py-3.5 bg-emerald-500 text-slate-950 rounded-xl font-semibold hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
          >
            Sign in
          </Link>
          <Link href="/register" className="mt-4 text-slate-400 hover:text-slate-200 text-sm">
            Create account (tester / viewer / admin)
          </Link>
          <p className="mt-6 text-slate-500 text-sm">
            You must sign in to use the dashboard and tests.
          </p>
        </>
      )}
    </main>
  );
}
