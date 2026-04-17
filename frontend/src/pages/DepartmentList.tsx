import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Building2, CheckCircle2, PauseCircle, Pencil, Plus, Search } from 'lucide-react';
import api from '../services/api';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { StandardTable, type TableColumn } from '../components/ui/table/StandardTable';
import { TableFilters, TABLE_FILTER_CONTROL_CLASS } from '../components/ui/table/TableFilters';
import { TablePagination } from '../components/ui/table/TablePagination';
import { TableActionButton } from '../components/ui/table/TableActionButton';
import {
  normalizeListResponse,
  type PageSizeOption,
  type PaginationMeta,
  type SortState,
} from '../utils/pagination';

type Department = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type FeedbackState = {
  type: 'success' | 'error';
  text: string;
} | null;

const defaultSort: SortState = { key: 'name', direction: 'asc' };

export function DepartmentList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [rows, setRows] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<PageSizeOption>(25);
  const [sort, setSort] = useState<SortState>(defaultSort);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    per_page: 25,
    total: 0,
    total_pages: 1,
  });

  const hasActiveFilters = Boolean(searchFilter);

  useEffect(() => {
    const incomingFeedback = (location.state as { feedback?: FeedbackState } | null)?.feedback;
    if (!incomingFeedback) {
      return;
    }

    setFeedback(incomingFeedback);
    window.history.replaceState({}, document.title);
  }, [location.state]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFeedback(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('perPage', String(perPage));
      params.set('sortBy', sort.key);
      params.set('sortOrder', sort.direction);
      if (searchFilter) {
        params.set('search', searchFilter.trim());
      }

      const response = await api.get(`/departments?${params.toString()}`);
      const normalized = normalizeListResponse<Department>(response.data, page, perPage);
      setRows(normalized.items);
      setMeta(normalized.meta);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Nao foi possivel carregar os departamentos.');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, searchFilter, sort]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const toggleDepartmentStatus = useCallback(
    async (department: Department, nextActive: boolean) => {
      try {
        setPendingActionId(department.id);
        setError(null);

        const response = await api.put<Department>(`/departments/${department.id}`, {
          name: department.name,
          isActive: nextActive,
        });

        setFeedback({
          type: 'success',
          text: nextActive
            ? `Departamento reativado com sucesso. Atualizado em ${new Date(
                response.data.updatedAt,
              ).toLocaleString('pt-BR')}.`
            : `Departamento desativado com sucesso. O historico existente foi preservado e a ultima atualizacao foi em ${new Date(
                response.data.updatedAt,
              ).toLocaleString('pt-BR')}.`,
        });

        await fetchDepartments();
      } catch (requestError: any) {
        console.error(requestError);
        setFeedback({
          type: 'error',
          text: requestError.response?.data || 'Nao foi possivel atualizar o departamento.',
        });
      } finally {
        setPendingActionId(null);
        setConfirmModal((current) => ({ ...current, isOpen: false }));
      }
    },
    [fetchDepartments],
  );

  const columns = useMemo<TableColumn<Department>[]>(
    () => [
      {
        id: 'name',
        label: 'Centro de custo',
        sortable: true,
        sortKey: 'name',
        cell: (department) => (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 p-1.5 text-slate-500">
              <Building2 className="h-3.5 w-3.5" />
            </span>
            <div className="space-y-0.5">
              <span className="block font-semibold text-slate-800">{department.name}</span>
              <span className="text-xs text-slate-500">
                Criado em {formatDepartmentDate(department.createdAt)}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: 'status',
        label: 'Status',
        sortable: true,
        sortKey: 'isActive',
        cell: (department) => (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
              department.isActive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {department.isActive ? 'Ativo' : 'Inativo'}
          </span>
        ),
      },
      {
        id: 'updatedAt',
        label: 'Ultima atualizacao',
        sortable: true,
        sortKey: 'updatedAt',
        cell: (department) => (
          <span className="text-sm text-slate-700">
            {formatDepartmentDateTime(department.updatedAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        label: 'Acoes',
        align: 'right',
        cell: (department) => (
          <div className="flex justify-end gap-2">
            <TableActionButton
              icon={Pencil}
              label="Editar departamento"
              tone="primary"
              onClick={() => navigate(`/app/departments/${department.id}/edit`)}
            />
            <TableActionButton
              icon={department.isActive ? PauseCircle : CheckCircle2}
              label={department.isActive ? 'Desativar departamento' : 'Reativar departamento'}
              tone={department.isActive ? 'danger' : 'success'}
              disabled={pendingActionId === department.id}
              onClick={() => {
                if (!department.isActive) {
                  toggleDepartmentStatus(department, true);
                  return;
                }

                setConfirmModal({
                  isOpen: true,
                  title: 'Desativar departamento',
                  message:
                    'Pedidos e historico nao serao apagados, mas o departamento deixara de aceitar novos pedidos e novas configuracoes de fluxo. Deseja continuar?',
                  onConfirm: () => toggleDepartmentStatus(department, false),
                });
              }}
            />
          </div>
        ),
      },
    ],
    [navigate, pendingActionId, toggleDepartmentStatus],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Departamentos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie centros de custo e controle quais continuam operacionais para novos pedidos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/app/departments/new')}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Novo departamento
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{feedback.text}</p>
        </div>
      )}

      <TableFilters
        onApply={() => {
          setPage(1);
          setSearchFilter(searchInput);
        }}
        onClear={() => {
          setSearchInput('');
          setSearchFilter('');
          setPage(1);
        }}
        hasActiveFilters={hasActiveFilters}
        applying={loading}
      >
        <div className="xl:col-span-12">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Buscar departamento
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className={`${TABLE_FILTER_CONTROL_CLASS} pl-9`}
              placeholder="Digite o nome do departamento"
            />
          </div>
        </div>
      </TableFilters>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <StandardTable
          className="rounded-none border-0 shadow-none"
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          loading={loading}
          error={error}
          onRetry={fetchDepartments}
          sort={sort}
          onSortChange={(nextSort) => {
            setSort(nextSort);
            setPage(1);
          }}
          hasActiveFilters={hasActiveFilters}
          emptyTitle="Nenhum departamento cadastrado"
          emptyDescription="Cadastre departamentos para organizar responsabilidades e aprovacoes."
          noResultsTitle="Nenhum departamento encontrado"
          noResultsDescription="A busca aplicada nao retornou resultados."
          minWidthClassName="min-w-[940px]"
        />

        <TablePagination
          page={meta.page}
          perPage={meta.per_page}
          total={meta.total}
          disabled={loading}
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(value);
            setPage(1);
          }}
        />
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((current) => ({ ...current, isOpen: false }))}
        confirmText="Desativar"
      />
    </div>
  );
}

function formatDepartmentDate(value?: string) {
  if (!value) {
    return 'Nao disponivel';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000) {
    return 'Nao disponivel';
  }

  return date.toLocaleDateString('pt-BR');
}

function formatDepartmentDateTime(value?: string) {
  if (!value) {
    return 'Nao disponivel';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000) {
    return 'Nao disponivel';
  }

  return date.toLocaleString('pt-BR');
}
