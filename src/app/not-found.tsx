import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md rounded-2xl border bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">The requested business module could not be found.</p>
        <Link className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm text-white" href="/dashboard">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}

