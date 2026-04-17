import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS, type PageSizeOption } from '../../../utils/pagination';

type TablePaginationProps = {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (nextPage: number) => void;
  onPerPageChange: (nextPerPage: PageSizeOption) => void;
  disabled?: boolean;
};

export function TablePagination({
  page,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
  disabled = false,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(perPage, 1)));
  const canGoBack = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-slate-600 sm:text-sm">
        <span className="font-medium text-slate-700">{total}</span> registros
        <span className="mx-2 text-slate-300">|</span>
        Pagina <span className="font-medium text-slate-700">{page}</span> de{' '}
        <span className="font-medium text-slate-700">{totalPages}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-medium text-slate-500 sm:text-sm" htmlFor="table-page-size">
          Por pagina
        </label>
        <select
          id="table-page-size"
          value={perPage}
          disabled={disabled}
          onChange={(event) => onPerPageChange(Number(event.target.value) as PageSizeOption)}
          className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={disabled || !canGoBack}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Pagina anterior"
          title="Pagina anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={disabled || !canGoNext}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Proxima pagina"
          title="Proxima pagina"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
