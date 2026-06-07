export default function Loading() {
  return (
    <div className="p-6">
      <div className="h-8 w-40 bg-slate-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 rounded animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-slate-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-64 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 bg-slate-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
