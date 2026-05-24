import Link from "next/link";

export function Pagination({
  basePath,
  page,
  totalPages,
  params
}: {
  basePath: string;
  page: number;
  totalPages: number;
  params?: Record<string, string | undefined>;
}) {
  const buildHref = (nextPage: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value) search.set(key, value);
    }
    if (nextPage > 1) search.set("page", String(nextPage));
    return `${basePath}${search.toString() ? `?${search.toString()}` : ""}`;
  };

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        className={`rounded-md px-3 py-2 text-sm font-medium ${page > 1 ? "bg-slate-100 text-slate-900 hover:bg-slate-200" : "pointer-events-none bg-slate-50 text-slate-400"}`}
      >
        Previous
      </Link>
      {pages.map((current) => (
        <Link
          key={current}
          href={buildHref(current)}
          className={`rounded-md px-3 py-2 text-sm font-medium ${current === page ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900 hover:bg-slate-200"}`}
        >
          {current}
        </Link>
      ))}
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        className={`rounded-md px-3 py-2 text-sm font-medium ${page < totalPages ? "bg-slate-100 text-slate-900 hover:bg-slate-200" : "pointer-events-none bg-slate-50 text-slate-400"}`}
      >
        Next
      </Link>
    </div>
  );
}
