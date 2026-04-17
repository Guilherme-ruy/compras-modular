import type { ReactNode } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Inbox, Loader2, SearchX } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { SortState } from '../../../utils/pagination';

export type TableColumn<T> = {
  id: string;
  label: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  sortKey?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
};

type StandardTableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  sort?: SortState | null;
  onSortChange?: (sort: SortState) => void;
  hasActiveFilters?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  noResultsTitle?: string;
  noResultsDescription?: string;
  minWidthClassName?: string;
  className?: string;
};

const headerAlignMap = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

const cellAlignMap = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

export function StandardTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  onRetry,
  sort,
  onSortChange,
  hasActiveFilters = false,
  emptyTitle,
  emptyDescription,
  noResultsTitle = 'Nenhum resultado encontrado',
  noResultsDescription = 'Tente ajustar os filtros para ampliar os resultados.',
  minWidthClassName = 'min-w-[720px]',
  className,
}: StandardTableProps<T>) {
  const renderSortIcon = (columnSortKey: string) => {
    if (!sort || sort.key !== columnSortKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />;
    }
    return sort.direction === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-brand-600" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-brand-600" />
    );
  };

  const handleSortClick = (column: TableColumn<T>) => {
    if (!column.sortable || !onSortChange) {
      return;
    }

    const columnSortKey = column.sortKey ?? column.id;
    const nextDirection =
      sort?.key === columnSortKey && sort.direction === 'asc' ? 'desc' : 'asc';

    onSortChange({ key: columnSortKey, direction: nextDirection });
  };

  const stateContent = (() => {
    if (loading) {
      return (
        <div className="flex min-h-52 flex-col items-center justify-center gap-2 px-6 py-10 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          <p className="text-sm">Carregando dados...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-52 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <div className="rounded-full bg-red-50 p-3 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Erro ao carregar dados</p>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              Tentar novamente
            </button>
          )}
        </div>
      );
    }

    if (rows.length === 0) {
      const title = hasActiveFilters ? noResultsTitle : emptyTitle;
      const description = hasActiveFilters ? noResultsDescription : emptyDescription;
      const Icon = hasActiveFilters ? SearchX : Inbox;

      return (
        <div className="flex min-h-52 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <div className="rounded-full bg-slate-100 p-3 text-slate-500">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            {description && <p className="text-sm text-slate-500">{description}</p>}
          </div>
        </div>
      );
    }

    return null;
  })();

  if (stateContent) {
    return (
      <div className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
        {stateContent}
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      <div className="overflow-x-auto">
        <table className={cn('w-full text-sm text-slate-700', minWidthClassName)}>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => {
                const align = column.align ?? 'left';
                const columnSortKey = column.sortKey ?? column.id;

                return (
                  <th
                    key={column.id}
                    className={cn(
                      'px-5 py-3 font-semibold',
                      headerAlignMap[align],
                      column.headerClassName,
                    )}
                    scope="col"
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSortClick(column)}
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide transition-colors hover:text-brand-700',
                          align === 'right' ? 'ml-auto' : '',
                        )}
                      >
                        {column.label}
                        {renderSortIcon(columnSortKey)}
                      </button>
                    ) : (
                      <span>{column.label}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-slate-100 transition-colors hover:bg-slate-50/70">
                {columns.map((column) => {
                  const align = column.align ?? 'left';
                  return (
                    <td
                      key={`${rowKey(row)}-${column.id}`}
                      className={cn('px-5 py-3.5 align-middle', cellAlignMap[align], column.className)}
                    >
                      {column.cell(row)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
