export const PAGE_SIZE = 20;

export function parsePage(params: Record<string, string | string[] | undefined>): number {
  const raw = Array.isArray(params.page) ? params.page[0] : params.page;
  const n = parseInt(raw ?? "1", 10);
  return isNaN(n) || n < 1 ? 1 : n;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
}

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE): PaginatedResult<T> {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(page, pages);
  const start = (current - 1) * size;
  return { data: items.slice(start, start + size), total, page: current, pages, pageSize: size };
}

export function paginationArgs(page: number, size = PAGE_SIZE) {
  return { skip: (page - 1) * size, take: size };
}
