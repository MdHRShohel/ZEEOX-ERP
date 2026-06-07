import { LoginForm } from "./form";

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900">ZEEOX ERP</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
          </div>
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
