import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, FileText, FileSpreadsheet, Download, RefreshCw, AlertCircle, Filter, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { TABLE_FILTER_CONTROL_CLASS } from '../../../components/ui/table/TableFilters';
import { MultiSelect } from '../../../components/ui/MultiSelect';
import { ColumnConfigurator } from './ColumnConfigurator';
import { fetchReportData, fetchDepartmentsForReport, fetchSuppliersForReport } from '../api/reports.api';
import { exportCsv, exportXlsx, exportPdf, generateRows } from '../utils/exporters';
import { ALL_COLUMNS, DEFAULT_SELECTED_IDS } from '../types';
import { PurchaseStatusLabels } from '../../../constants/purchases';
import type { ColumnDef, ExportPurchase, ReportFilters } from '../types';

const EMPTY_FILTERS: ReportFilters = {
  startDate:    '',
  endDate:      '',
  status:       '',
  departmentId: [],
  supplierId:   [],
  search:       '',
};

const PREVIEW_LIMIT = 10;

export default function Reports() {
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [suppliers,   setSuppliers]   = useState<{ id: string; companyName: string }[]>([]);

  const [formFilters,    setFormFilters]    = useState<ReportFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>(EMPTY_FILTERS);

  const [selectedCols, setSelectedCols] = useState<ColumnDef[]>(
    () => DEFAULT_SELECTED_IDS.map((id) => ALL_COLUMNS.find((c) => c.id === id)!),
  );

  const [data,    setData]    = useState<ExportPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [exporting, setExporting] = useState<'csv' | 'xlsx' | 'pdf' | null>(null);

  const [showColumnConfig, setShowColumnConfig] = useState(false);

  // Load select options once
  useEffect(() => {
    fetchDepartmentsForReport().then(setDepartments).catch(console.error);
    fetchSuppliersForReport().then(setSuppliers).catch(console.error);
  }, []);

  const loadData = useCallback(async (filters: ReportFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchReportData(filters);
      setData(result);
    } catch {
      setError('Não foi possível carregar os dados. Verifique os filtros e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount with empty filters
  useEffect(() => {
    loadData(appliedFilters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters() {
    setAppliedFilters(formFilters);
    loadData(formFilters);
  }

  function clearFilters() {
    setFormFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    loadData(EMPTY_FILTERS);
  }

  const previewRows = useMemo(
    () => generateRows(data.slice(0, PREVIEW_LIMIT), selectedCols),
    [data, selectedCols],
  );

  const totalRows = useMemo(
    () => generateRows(data, selectedCols),
    [data, selectedCols],
  );

  async function handleExport(format: 'csv' | 'xlsx' | 'pdf') {
    if (selectedCols.length === 0) return;
    setExporting(format);
    try {
      const filename = `relatorio-compras-${new Date().toISOString().slice(0, 10)}`;
      if (format === 'csv')  exportCsv(data, selectedCols, filename);
      if (format === 'xlsx') exportXlsx(data, selectedCols, filename);
      if (format === 'pdf')  exportPdf(data, selectedCols, filename);
    } finally {
      setExporting(null);
    }
  }

  const canExport = selectedCols.length > 0 && data.length > 0 && !loading;

  function setFilter<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) {
    setFormFilters((prev) => ({ ...prev, [key]: value }));
  }

  function applyPreset(days: number, months: number = 0) {
    const end = new Date();
    const start = new Date();
    if (days > 0) {
      start.setDate(end.getDate() - days);
    } else if (months > 0) {
      start.setMonth(end.getMonth() - months);
    }
    setFormFilters((prev) => ({
      ...prev,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    }));
  }

  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure filtros, personalize colunas e exporte dados de pedidos de compra.
          </p>
        </div>
        
        {/* Export buttons moved to header */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canExport || exporting !== null}
            onClick={() => handleExport('csv')}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {exporting === 'csv' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            CSV
          </button>
          <button
            type="button"
            disabled={!canExport || exporting !== null}
            onClick={() => handleExport('xlsx')}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {exporting === 'xlsx' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            Excel
          </button>
          <button
            type="button"
            disabled={!canExport || exporting !== null}
            onClick={() => handleExport('pdf')}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {exporting === 'pdf' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            Filtros
          </h2>
          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 mr-1">Predefinições:</span>
            {[
              { label: '30 Dias', d: 30, m: 0 },
              { label: '60 Dias', d: 60, m: 0 },
              { label: '90 Dias', d: 90, m: 0 },
              { label: '6 Meses', d: 0, m: 6 },
              { label: '12 Meses', d: 0, m: 12 },
            ].map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.d, preset.m)}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 items-end">
          {/* Dates */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Data Início
            </label>
            <input
              type="date"
              value={formFilters.startDate}
              onChange={(e) => setFilter('startDate', e.target.value)}
              className={TABLE_FILTER_CONTROL_CLASS}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Data Fim
            </label>
            <input
              type="date"
              value={formFilters.endDate}
              onChange={(e) => setFilter('endDate', e.target.value)}
              className={TABLE_FILTER_CONTROL_CLASS}
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              value={formFilters.status}
              onChange={(e) => setFilter('status', e.target.value)}
              className={TABLE_FILTER_CONTROL_CLASS}
            >
              <option value="">Todos</option>
              {Object.entries(PurchaseStatusLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {/* Department MultiSelect */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Departamentos
            </label>
            <MultiSelect
              options={departments.map(d => ({ value: d.id, label: d.name }))}
              value={formFilters.departmentId}
              onChange={(v) => setFilter('departmentId', v)}
              placeholder="Todos"
            />
          </div>

          {/* Supplier MultiSelect */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Fornecedores
            </label>
            <MultiSelect
              options={suppliers.map(s => ({ value: s.id, label: s.companyName }))}
              value={formFilters.supplierId}
              onChange={(v) => setFilter('supplierId', v)}
              placeholder="Todos"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={applyFilters}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-slate-500 underline underline-offset-2 hover:text-slate-700"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Column configurator (Collapsible) */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowColumnConfig(!showColumnConfig)}
          className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors"
        >
          <div className="flex flex-col items-start">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-slate-400" />
              Personalizar Colunas do Relatório
            </h2>
            {!showColumnConfig && (
              <span className="mt-1 text-xs text-slate-500">
                {selectedCols.length} colunas selecionadas
              </span>
            )}
          </div>
          {showColumnConfig ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </button>
        
        {showColumnConfig && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50">
            <p className="mb-4 text-xs font-normal text-slate-500">
              Arraste para reordenar. Clique em + para adicionar.
            </p>
            <ColumnConfigurator selected={selectedCols} onChange={setSelectedCols} />
          </div>
        )}
      </div>

      {/* Preview table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Info bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border-b border-slate-100 px-5 py-3">
          <div className="text-sm text-slate-600">
            {loading ? (
              <span className="inline-flex items-center gap-2 text-slate-400">
                <RefreshCw className="h-4 w-4 animate-spin" /> Carregando dados…
              </span>
            ) : error ? (
              <span className="inline-flex items-center gap-2 text-red-500">
                <AlertCircle className="h-4 w-4" /> {error}
              </span>
            ) : (
              <>
                <span className="font-semibold text-slate-800">{data.length}</span> pedidos encontrados
                {data.length > PREVIEW_LIMIT && (
                  <span className="ml-1 text-slate-400">
                    — exibindo os primeiros {PREVIEW_LIMIT}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Table wrapper */}
        <div className="overflow-x-auto">
          {selectedCols.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">
              Selecione ao menos uma coluna para visualizar o relatório
            </div>
          ) : loading ? (
            <div className="py-16 text-center text-sm text-slate-400">
              <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin" />
              Carregando…
            </div>
          ) : data.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">
              Nenhum pedido encontrado para os filtros aplicados
            </div>
          ) : (
            <table className="w-full min-w-max text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left">
                <tr>
                  {selectedCols.map((col) => (
                    <th
                      key={col.id}
                      className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {previewRows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-slate-50 transition-colors">
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="max-w-[240px] truncate px-4 py-3 text-slate-700"
                        title={cell}
                      >
                        {cell || <span className="text-slate-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalRows.length > PREVIEW_LIMIT && (
          <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 text-center text-xs font-medium text-slate-500">
            {totalRows.length - PREVIEW_LIMIT} linha(s) adicionais incluídas na exportação (CSV/Excel/PDF)
          </div>
        )}
      </div>
    </div>
  );
}
