import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-950">
      <h1 className="text-4xl font-bold text-slate-100 mb-3 tracking-tight">
        Automation Testing
      </h1>
      <p className="text-slate-400 mb-10 max-w-md text-center text-lg">
        Run and view test executions with self-healing locators.
      </p>
      <Link
        href="/dashboard"
        className="px-8 py-3.5 bg-emerald-500 text-slate-950 rounded-xl font-semibold hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
      >
        Open Dashboard
      </Link>
      <div className="mt-12 flex gap-6">
        <Link href="/create-test" className="text-slate-400 hover:text-slate-200 text-sm transition">
          Create Test
        </Link>
      </div>
    </main>
  );
}
