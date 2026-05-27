import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Check, X, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export type MultiSelectOption = {
  value: string;
  label: string;
};

type Props = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
};

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  className,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOptions = useMemo(
    () => options.filter((opt) => value.includes(opt.value)),
    [options, value]
  );

  const filteredOptions = useMemo(
    () => options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  function toggleOption(optValue: string) {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  }

  function removeOption(e: React.MouseEvent, optValue: string) {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optValue));
  }

  function clearAll(e: React.MouseEvent) {
    e.stopPropagation();
    onChange([]);
  }

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* Trigger / Selected Pills */}
      <div
        className="min-h-[38px] w-full cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 hover:border-slate-300 transition-colors flex gap-2 flex-wrap"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex flex-wrap gap-1.5 flex-1 items-center">
          {selectedOptions.length === 0 ? (
            <span className="text-sm text-slate-400">{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 rounded bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700 border border-brand-100"
              >
                {opt.label}
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-brand-200 text-brand-600 transition-colors focus:outline-none"
                  onClick={(e) => removeOption(e, opt.value)}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>
        
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {value.length > 0 && (
            <button
              type="button"
              className="p-0.5 hover:text-red-500 transition-colors focus:outline-none"
              onClick={clearAll}
              title="Limpar todos"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-100">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors placeholder:text-slate-400"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-sm text-slate-500">Nenhum resultado encontrado.</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors',
                      isSelected ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-700 hover:bg-slate-100'
                    )}
                    onClick={() => toggleOption(opt.value)}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
