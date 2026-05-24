export function parsePage(value: string | undefined, fallback = 1) {
  const page = Number.parseInt(value ?? "", 10);
  return Number.isFinite(page) && page > 0 ? page : fallback;
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasPrev: currentPage > 1,
    hasNext: currentPage < totalPages
  };
}
