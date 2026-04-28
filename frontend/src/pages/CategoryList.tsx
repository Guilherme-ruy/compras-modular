import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Layers, PauseCircle, Pencil, Plus, Search } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { StandardTable, type TableColumn } from '../components/ui/table/StandardTable';
import { TableFilters, TABLE_FILTER_CONTROL_CLASS } from '../components/ui/table/TableFilters';
import { TablePagination } from '../components/ui/table/TablePagination';
import { TableActionButton } from '../components/ui/table/TableActionButton';
import { normalizeListResponse, type PageSizeOption, type PaginationMeta, type SortState } from '../utils/pagination';

type Category = {
  id: string;
  name: string;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  isActive: boolean;
  _count: { items: number };
};

type FeedbackState = { type: 'success' | 'error'; text: string } | null;

const defaultSort: SortState = { key: 'name', direction: 'asc' };

export function CategoryList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = ['SUPERADMIN', 'ADMIN'].includes(user?.roleName ?? '');

  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<PageSizeOption>(25);
  const [sort, setSort] = useState<SortState>(defaultSort);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, per_page: 25, total: 0, total_pages: 1 });

  useEffect(() => {
    const incoming = (location.state as { feedback?: FeedbackState } | null)?.feedback;
    if (incoming) { setFeedback(incoming); window.history.replaceState({}, document.title); }
  }, [location.state]);

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(null), 5000);
    return () => window.clearTimeout(t);
  }, [feedback]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('perPage', String(perPage));
      if (searchFilter) params.set('search', searchFilter.trim());
      const res = await api.get(`/categories?${params.toString()}`);
      const normalized = normalizeListResponse<Category>(res.data, page, perPage);
      setRows(normalized.items);
      setMeta(normalized.meta);
    } catch {
      setError('Não foi possível carregar as categorias.');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, searchFilter]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const toggleStatus = useCallback(async (cat: Category) => {
    try {
      setPendingActionId(cat.id);
      await api.put(`/categories/${cat.id}`, { isActive: !cat.isActive });
      setFeedback({ type: 'success', text: `Categoria "${cat.name}" ${!cat.isActive ? 'ativada' : 'desativada'}.` });
      await fetchCategories();
    } catch {
      setFeedback({ type: 'error', text: 'Não foi possível alterar o status da categoria.' });
    } finally {
      setPendingActionId(null);
    }
  }, [fetchCategories]);

  const columns = useMemo<TableColumn<Category>[]>(() => [
    {
      id: 'name',
      label: 'Categoria',
      sortable: true,
      sortKey: 'name',
      cell: (cat) => (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 p-1.5 text-slate-500">
            <Layers className="h-3.5 w-3.5" />
          </span>
          <div>
            <span className="block font-semibold text-slate-800">{cat.name}</span>
            {cat.parent && (
              <span className="text-xs text-slate-500">↳ {cat.parent.name}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'usage',
      label: 'Uso',
      cell: (cat) => (
        <span className="text-sm text-slate-600">
          {cat._count.items} {cat._count.items === 1 ? 'item' : 'itens'}
        </span>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      cell: (cat) => (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cat.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
          {cat.isActive ? 'Ativa' : 'Inativa'}
        </span>
      ),
    },
    ...(isAdmin ? [{
      id: 'actions',
      label: 'Ações',
      align: 'right' as const,
      cell: (cat: Category) => (
        <div className="flex justify-end gap-2">
          <TableActionButton icon={Pencil} label="Editar" tone="primary" onClick={() => navigate(`/app/categories/${cat.id}/edit`)} />
          <TableActionButton
            icon={cat.isActive ? PauseCircle : CheckCircle2}
            label={cat.isActive ? 'Desativar' : 'Ativar'}
            tone={cat.isActive ? 'danger' : 'success'}
            disabled={pendingActionId === cat.id}
            onClick={() => toggleStatus(cat)}
          />
        </div>
      ),
    }] : []),
  ], [isAdmin, navigate, pendingActionId, toggleStatus]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Categorias</h1>
          <p className="mt-1 text-sm text-slate-500">
            Classifique os itens de compra para relatórios e análise de gastos.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => navigate('/app/categories/new')}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Nova categoria
          </button>
        )}
      </div>

      {feedback && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {feedback.type === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          <p>{feedback.text}</p>
        </div>
      )}

      <TableFilters
        onApply={() => { setPage(1); setSearchFilter(searchInput); }}
        onClear={() => { setSearchInput(''); setSearchFilter(''); setPage(1); }}
        hasActiveFilters={Boolean(searchFilter)}
        applying={loading}
      >
        <div className="xl:col-span-12">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar categoria</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`${TABLE_FILTER_CONTROL_CLASS} pl-9`}
              placeholder="Digite o nome da categoria"
            />
          </div>
        </div>
      </TableFilters>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <StandardTable
          className="rounded-none border-0 shadow-none"
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={fetchCategories}
          sort={sort}
          onSortChange={(s) => { setSort(s); setPage(1); }}
          hasActiveFilters={Boolean(searchFilter)}
          emptyTitle="Nenhuma categoria cadastrada"
          emptyDescription="Categorias organizam os itens de compra por área de gasto."
          noResultsTitle="Nenhuma categoria encontrada"
          noResultsDescription="A busca aplicada não retornou resultados."
          minWidthClassName="min-w-[640px]"
        />
        <TablePagination
          page={meta.page}
          perPage={meta.per_page}
          total={meta.total}
          disabled={loading}
          onPageChange={setPage}
          onPerPageChange={(v) => { setPerPage(v); setPage(1); }}
        />
      </div>
    </div>
  );
}
