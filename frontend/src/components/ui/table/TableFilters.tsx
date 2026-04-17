import type { ReactNode } from 'react';
import { Filter, RotateCcw, Search } from 'lucide-react';
import { cn } from '../../../utils/cn';

export const TABLE_FILTER_CONTROL_CLASS =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm transition-colors outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

type TableFiltersProps = {
  title?: string;
  description?: string;
  onApply: () => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  applying?: boolean;
  children: ReactNode;
  className?: string;
};

export function TableFilters({
  title = 'Filtros',
  description = 'Refine os resultados da listagem',
  onApply,
  onClear,
  hasActiveFilters,
  applying = false,
  children,
  className,
}: TableFiltersProps) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-slate-100 p-2 text-slate-600">
          <Filter className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">{children}</div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
        >
          <RotateCcw className="h-4 w-4" />
          Limpar
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={applying}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          {applying ? 'Buscando...' : hasActiveFilters ? 'Aplicar filtros' : 'Buscar'}
        </button>
      </div>
    </div>
  );
}
