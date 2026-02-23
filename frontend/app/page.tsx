import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-4">
        Automation Testing
      </h1>
      <p className="text-slate-600 mb-8 max-w-md text-center">
        Run and view test executions with self-healing locators.
      </p>
      <Link
        href="/dashboard"
        className="px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition"
      >
        Open Dashboard
      </Link>
    </main>
  );
}
