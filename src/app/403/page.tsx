import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-5xl font-bold text-slate-200">403</p>
        <p className="mt-4 text-lg font-semibold text-slate-700">Access denied</p>
        <p className="mt-1 text-sm text-slate-500">You do not have permission to view this page.</p>
        <Link href="/dashboard" className="mt-6 inline-block text-sm text-slate-900 underline">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
