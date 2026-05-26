import { useRef, useState } from 'react';
import { GripVertical, X, Plus } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { ColumnDef, ReportSection } from '../types';
import { ALL_COLUMNS, SECTION_LABELS } from '../types';

type Props = {
  selected: ColumnDef[];
  onChange: (cols: ColumnDef[]) => void;
};

const SECTION_ORDER: ReportSection[] = ['summary', 'items', 'approvals'];

const SECTION_COLORS: Record<ReportSection, string> = {
  summary:   'bg-blue-50 text-blue-700 border-blue-200',
  items:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  approvals: 'bg-amber-50 text-amber-700 border-amber-200',
};

const SECTION_BADGE: Record<ReportSection, string> = {
  summary:   'bg-blue-100 text-blue-700',
  items:     'bg-emerald-100 text-emerald-700',
  approvals: 'bg-amber-100 text-amber-700',
};

export function ColumnConfigurator({ selected, onChange }: Props) {
  const selectedIds = new Set(selected.map((c) => c.id));

  const dragIndexRef = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function addColumn(col: ColumnDef) {
    if (!selectedIds.has(col.id)) onChange([...selected, col]);
  }

  function removeColumn(id: string) {
    onChange(selected.filter((c) => c.id !== id));
  }

  function handleDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function handleDragEnter(index: number) {
    setOverIndex(index);
    const from = dragIndexRef.current;
    if (from === null || from === index) return;
    const next = [...selected];
    const [item] = next.splice(from, 1);
    next.splice(index, 0, item);
    dragIndexRef.current = index;
    onChange(next);
  }

  function handleDragEnd() {
    dragIndexRef.current = null;
    setOverIndex(null);
  }

  const available = ALL_COLUMNS.filter((c) => !selectedIds.has(c.id));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Available columns */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Colunas disponíveis
        </p>
        <div className="space-y-3">
          {SECTION_ORDER.map((section) => {
            const cols = available.filter((c) => c.section === section);
            return (
              <div key={section} className={cn('rounded-lg border p-3', SECTION_COLORS[section])}>
                <p className="mb-2 text-xs font-semibold">{SECTION_LABELS[section]}</p>
                {cols.length === 0 ? (
                  <p className="text-xs opacity-60">Todas as colunas adicionadas</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {cols.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => addColumn(col)}
                        className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                      >
                        <Plus className="h-3 w-3 text-slate-400" />
                        {col.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected columns (sortable) */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Colunas no relatório{' '}
          <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-slate-600">
            {selected.length}
          </span>
        </p>

        {selected.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
            Selecione colunas ao lado para montar o relatório
          </div>
        ) : (
          <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2">
            {selected.map((col, i) => (
              <div
                key={col.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragEnter={() => handleDragEnter(i)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={handleDragEnd}
                className={cn(
                  'flex items-center gap-2 rounded-md border bg-white px-2 py-1.5 shadow-sm transition-all',
                  overIndex === i ? 'border-brand-400 ring-1 ring-brand-300' : 'border-slate-200',
                )}
              >
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-slate-300 active:cursor-grabbing" />
                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', SECTION_BADGE[col.section])}>
                  {SECTION_LABELS[col.section].split(' ')[0]}
                </span>
                <span className="flex-1 truncate text-xs text-slate-700">{col.label}</span>
                <button
                  type="button"
                  onClick={() => removeColumn(col.id)}
                  className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="self-start text-xs text-slate-400 underline underline-offset-2 hover:text-red-500"
          >
            Limpar todas
          </button>
        )}
      </div>
    </div>
  );
}
