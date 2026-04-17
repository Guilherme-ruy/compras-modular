import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, Plus, Search } from 'lucide-react';
import api from '../services/api';
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
};

type Department = {
  id: string;
  name: string;
};

type PurchaseFilters = {
  search: string;
  status: string;
  departmentId: string;
};

const defaultFilters: PurchaseFilters = {
  search: '',
  status: '',
  departmentId: '',
};

const defaultSort: SortState = { key: 'number', direction: 'desc' };

export function PurchaseList() {
  const navigate = useNavigate();
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

        <button
          type="button"
          onClick={() => navigate('/app/purchases/new')}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Novo pedido
        </button>
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
        <div className="xl:col-span-4">
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

        <div className="xl:col-span-4">
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

        <div className="xl:col-span-4">
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
