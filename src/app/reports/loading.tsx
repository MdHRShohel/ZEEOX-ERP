export default function Loading() {
  return (
    <div className="p-6">
      <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-6" />
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-28 bg-slate-200 rounded animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-slate-200 rounded animate-pulse" />
    </div>
  );
}
