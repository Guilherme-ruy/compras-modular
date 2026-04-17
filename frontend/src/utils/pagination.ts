export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];
export type SortDirection = 'asc' | 'desc';

export type SortState = {
  key: string;
  direction: SortDirection;
};

export type PaginationMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

type NormalizedListResult<T> = {
  items: T[];
  meta: PaginationMeta;
};

const defaultMeta = (page: number, perPage: number): PaginationMeta => ({
  page,
  per_page: perPage,
  total: 0,
  total_pages: 1,
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

export function normalizeListResponse<T>(
  payload: unknown,
  page: number,
  perPage: number,
): NormalizedListResult<T> {
  if (Array.isArray(payload)) {
    return {
      items: payload as T[],
      meta: {
        page,
        per_page: perPage,
        total: payload.length,
        total_pages: 1,
      },
    };
  }

  if (!isObject(payload) || !Array.isArray(payload.data) || !isObject(payload.meta)) {
    return { items: [], meta: defaultMeta(page, perPage) };
  }

  const meta = payload.meta;
  const normalizedMeta: PaginationMeta = {
    page: Math.max(1, toNumber(meta.page, page)),
    per_page: Math.max(1, toNumber(meta.per_page, perPage)),
    total: Math.max(0, toNumber(meta.total, payload.data.length)),
    total_pages: Math.max(1, toNumber(meta.total_pages, 1)),
  };

  return {
    items: payload.data as T[],
    meta: normalizedMeta,
  };
}
