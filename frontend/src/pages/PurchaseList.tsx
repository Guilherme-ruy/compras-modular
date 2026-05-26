import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, ClipboardList, Eye, Plus, Search, Tag } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PurchaseStatusColors, PurchaseStatusLabels } from '../constants/purchases';
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

type Purchase = {
  id: string;
  number: number;
  departmentId: string;
  totalAmount: number;
  status: string;
  supplier?: {
    companyName: string;
  } | null;
  metadata?: any;
};

type Department = {
  id: string;
  name: string;
};

type PurchaseFilters = {
  search: string;
  status: string;
  priority: string;
  departmentId: string;
};

const defaultFilters: PurchaseFilters = {
  search: '',
  status: '',
  priority: '',
  departmentId: '',
};

const defaultSort: SortState = { key: 'number', direction: 'desc' };

export function PurchaseList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = user?.roleName?.toUpperCase() !== 'VIEWER';
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Purchase[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<PageSizeOption>(25);
  const [sort, setSort] = useState<SortState>(defaultSort);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    per_page: 25,
    total: 0,
    total_pages: 1,
  });

  const [formFilters, setFormFilters] = useState<PurchaseFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<PurchaseFilters>(defaultFilters);

  const hasActiveFilters = Boolean(
    appliedFilters.search || appliedFilters.status || appliedFilters.departmentId,
  );

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get('/departments');
      const payload = Array.isArray(response.data) ? response.data : response.data?.data;
      setDepartments(Array.isArray(payload) ? payload : []);
    } catch (fetchError) {
      console.error('Failed to fetch departments', fetchError);
    }
  }, []);

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('perPage', String(perPage));
      params.set('sortBy', sort.key);
      params.set('sortOrder', sort.direction);

      if (appliedFilters.search) {
        params.set('search', appliedFilters.search.trim());
      }
      if (appliedFilters.status) {
        params.set('status', appliedFilters.status);
      }
      if (appliedFilters.priority) {
        params.set('priority', appliedFilters.priority);
      }
      if (appliedFilters.departmentId) {
        params.set('departmentId', appliedFilters.departmentId);
      }

      const response = await api.get(`/purchases?${params.toString()}`);
      const normalized = normalizeListResponse<Purchase>(response.data, page, perPage);
      setRows(normalized.items);
      setMeta(normalized.meta);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Nao foi possivel carregar os pedidos.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, perPage, sort]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  useEffect(() => {
    if (!typeMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target as Node)) {
        setTypeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [typeMenuOpen]);

  const departmentNames = useMemo(() => {
    return new Map(departments.map((department) => [department.id, department.name]));
  }, [departments]);

  const columns = useMemo<TableColumn<Purchase>[]>(
    () => [
      {
        id: 'number',
        label: 'Pedido',
        sortable: true,
        sortKey: 'number',
        cell: (purchase) => (
          <span className="font-semibold text-slate-800">#{String(purchase.number).padStart(5, '0')}</span>
        ),
      },
      {
        id: 'supplier',
        label: 'Fornecedor',
        cell: (purchase) => (
          <span className="block max-w-[280px] truncate text-slate-700" title={purchase.supplier?.companyName || ''}>
            {purchase.supplier?.companyName || 'Nao vinculado'}
          </span>
        ),
      },
      {
        id: 'department',
        label: 'Departamento',
        cell: (purchase) => {
          const departmentName = departmentNames.get(purchase.departmentId);

          return (
            <span
              className="block max-w-[220px] truncate text-slate-700"
              title={departmentName || 'Departamento nao encontrado'}
            >
              {departmentName || 'Nao identificado'}
            </span>
          );
        },
      },
      {
        id: 'priority',
        label: 'Prioridade',
        cell: (purchase) => {
          const priority = purchase.metadata?.prioridade || 'BAIXA';
          return (
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priorityBadgeClass(priority)}`}
            >
              {priority}
            </span>
          );
        },
      },
      {
        id: 'totalAmount',
        label: 'Valor',
        sortable: true,
        sortKey: 'totalAmount',
        align: 'right',
        cell: (purchase) =>
          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
            Number(purchase.totalAmount),
          ),
      },
      {
        id: 'status',
        label: 'Status',
        sortable: true,
        sortKey: 'status',
        cell: (purchase) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              PurchaseStatusColors[purchase.status] || 'bg-slate-100 text-slate-800'
            }`}
          >
            {PurchaseStatusLabels[purchase.status] || purchase.status}
          </span>
        ),
      },
      {
        id: 'actions',
        label: 'Acoes',
        align: 'right',
        cell: (purchase) => (
          <div className="flex justify-end gap-2">
            <TableActionButton
              icon={Eye}
              label="Visualizar pedido"
              tone="primary"
              onClick={() => navigate(`/app/purchases/${purchase.id}`)}
            />
          </div>
        ),
      },
    ],
    [departmentNames, navigate],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pedidos de Compra</h1>
          <p className="mt-1 text-sm text-slate-500">Acompanhe e gerencie todos os pedidos.</p>
        </div>

        {canCreate && (
          <div ref={typeMenuRef} className="relative inline-flex">
            {/* Main action */}
            <button
              type="button"
              onClick={() => navigate('/app/purchases/new')}
              className="inline-flex h-10 items-center gap-2 rounded-l-lg bg-brand-600 pl-4 pr-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Novo pedido
            </button>
            {/* Divider */}
            <span className="my-2 w-px bg-white/20" />
            {/* Dropdown trigger */}
            <button
              type="button"
              onClick={() => setTypeMenuOpen((prev) => !prev)}
              aria-label="Escolher modalidade"
              className="inline-flex h-10 items-center rounded-r-lg bg-brand-600 px-2.5 text-white transition-colors hover:bg-brand-700"
            >
              <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${typeMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {typeMenuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1.5 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Modalidade de compra</p>
                </div>
                <button
                  type="button"
                  onClick={() => { navigate('/app/purchases/new?type=DIRECT'); setTypeMenuOpen(false); }}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Tag className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-slate-800">Fornecedor já definido</span>
                    <span className="block text-xs text-slate-500">Fluxo direto de aprovação</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/app/purchases/new?type=QUOTE'); setTypeMenuOpen(false); }}
                  className="flex w-full items-start gap-3 border-t border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-slate-800">Solicitar cotações</span>
                    <span className="block text-xs text-slate-500">Compradores enviam propostas</span>
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <TableFilters
        onApply={() => {
          setPage(1);
          setAppliedFilters(formFilters);
        }}
        onClear={() => {
          setFormFilters(defaultFilters);
          setAppliedFilters(defaultFilters);
          setPage(1);
        }}
        hasActiveFilters={hasActiveFilters}
        applying={loading}
      >
        <div className="xl:col-span-3">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Busca por numero
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={formFilters.search}
              onChange={(event) =>
                setFormFilters((previous) => ({ ...previous, search: event.target.value }))
              }
              className={`${TABLE_FILTER_CONTROL_CLASS} pl-9`}
              placeholder="Ex: 00015"
            />
          </div>
        </div>

        <div className="xl:col-span-3">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </label>
          <select
            value={formFilters.status}
            onChange={(event) =>
              setFormFilters((previous) => ({ ...previous, status: event.target.value }))
            }
            className={TABLE_FILTER_CONTROL_CLASS}
          >
            <option value="">Todos</option>
            {Object.entries(PurchaseStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="xl:col-span-3">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Prioridade
          </label>
          <select
            value={formFilters.priority}
            onChange={(event) =>
              setFormFilters((previous) => ({ ...previous, priority: event.target.value }))
            }
            className={TABLE_FILTER_CONTROL_CLASS}
          >
            <option value="">Todas</option>
            <option value="BAIXA">BAIXA</option>
            <option value="MEDIA">MÉDIA</option>
            <option value="ALTA">ALTA</option>
            <option value="URGENTE">URGENTE</option>
          </select>
        </div>

        <div className="xl:col-span-3">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              Departamento
            </span>
          </label>
          <select
            value={formFilters.departmentId}
            onChange={(event) =>
              setFormFilters((previous) => ({ ...previous, departmentId: event.target.value }))
            }
            className={TABLE_FILTER_CONTROL_CLASS}
          >
            <option value="">Todos</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
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
          onRetry={fetchPurchases}
          sort={sort}
          onSortChange={(nextSort) => {
            setSort(nextSort);
            setPage(1);
          }}
          hasActiveFilters={hasActiveFilters}
          emptyTitle="Nenhum pedido cadastrado"
          emptyDescription="Crie um novo pedido para comecar o fluxo de compras."
          noResultsTitle="Nenhum pedido encontrado"
          noResultsDescription="Nao houve correspondencia para os filtros aplicados."
          minWidthClassName="min-w-[1040px]"
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
    </div>
  );
}

function priorityBadgeClass(priority: string) {
  switch (priority.toUpperCase()) {
      case 'URGENTE': return 'bg-red-100 text-red-700 border border-red-200';
      case 'ALTA': return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'MEDIA': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'BAIXA': return 'bg-slate-100 text-slate-700 border border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}
