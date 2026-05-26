import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, FileText, FileSpreadsheet, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { TABLE_FILTER_CONTROL_CLASS } from '../../../components/ui/table/TableFilters';
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
  departmentId: '',
  supplierId:   '',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure filtros, personalize colunas e exporte dados de pedidos de compra.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Filtros</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {/* Date range */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Data início
            </label>
            <input
              type="date"
              value={formFilters.startDate}
              onChange={(e) => setFilter('startDate', e.target.value)}
              className={TABLE_FILTER_CONTROL_CLASS}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Data fim
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
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
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

          {/* Department */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Departamento
            </label>
            <select
              value={formFilters.departmentId}
              onChange={(e) => setFilter('departmentId', e.target.value)}
              className={TABLE_FILTER_CONTROL_CLASS}
            >
              <option value="">Todos</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Supplier */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Fornecedor
            </label>
            <select
              value={formFilters.supplierId}
              onChange={(e) => setFilter('supplierId', e.target.value)}
              className={TABLE_FILTER_CONTROL_CLASS}
            >
              <option value="">Todos</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.companyName}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Busca (observações)
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formFilters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                placeholder="Buscar em observações…"
                className={`${TABLE_FILTER_CONTROL_CLASS} pl-9`}
              />
            </div>
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

      {/* Column configurator */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">
          Colunas do relatório
          <span className="ml-2 text-xs font-normal text-slate-400">
            Arraste para reordenar. Clique em + para adicionar.
          </span>
        </h2>
        <ColumnConfigurator selected={selectedCols} onChange={setSelectedCols} />
      </div>

      {/* Preview + export */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Info bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
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
                    — prévia dos primeiros {PREVIEW_LIMIT}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canExport || exporting !== null}
              onClick={() => handleExport('csv')}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {exporting === 'csv' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              CSV
            </button>
            <button
              type="button"
              disabled={!canExport || exporting !== null}
              onClick={() => handleExport('xlsx')}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {exporting === 'xlsx' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
              Excel
            </button>
            <button
              type="button"
              disabled={!canExport || exporting !== null}
              onClick={() => handleExport('pdf')}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {exporting === 'pdf' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              PDF
            </button>
          </div>
        </div>

        {/* Preview table */}
        <div className="overflow-x-auto">
          {selectedCols.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">
              Selecione ao menos uma coluna para visualizar a prévia
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
                      className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {previewRows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-slate-50">
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="max-w-[240px] truncate px-4 py-2.5 text-slate-700"
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
          <div className="border-t border-slate-100 px-5 py-3 text-center text-xs text-slate-400">
            {totalRows.length - PREVIEW_LIMIT} linha(s) adicionais incluídas na exportação
          </div>
        )}
      </div>
    </div>
  );
}
