import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-5xl font-bold text-slate-200">404</p>
        <p className="mt-4 text-lg font-semibold text-slate-700">Page not found</p>
        <p className="mt-1 text-sm text-slate-500">The page you are looking for does not exist.</p>
        <Link href="/dashboard" className="mt-6 inline-block text-sm text-slate-900 underline">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
