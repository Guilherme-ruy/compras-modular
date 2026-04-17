import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import api from '../services/api';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { SupplierStatusColors, SupplierStatusLabels } from '../constants/suppliers';
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

export type Supplier = {
  id: string;
  companyName: string;
  tradeName: string;
  cnpj: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  contactName: string;
  email: string;
  phone: string;
};

type SupplierFilters = {
  search: string;
  status: string;
};

const defaultFilters: SupplierFilters = {
  search: '',
  status: '',
};

const defaultSort: SortState = {
  key: 'companyName',
  direction: 'asc',
};

export function SupplierList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Supplier[]>([]);
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

  const [formFilters, setFormFilters] = useState<SupplierFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<SupplierFilters>(defaultFilters);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  const hasActiveFilters = Boolean(appliedFilters.search || appliedFilters.status);

  const fetchSuppliers = useCallback(async () => {
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

      const response = await api.get(`/suppliers?${params.toString()}`);
      const normalized = normalizeListResponse<Supplier>(response.data, page, perPage);
      setRows(normalized.items);
      setMeta(normalized.meta);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Nao foi possivel carregar os fornecedores.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, perPage, sort]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const requestDelete = useCallback((id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir fornecedor',
      message: 'Tem certeza que deseja excluir este fornecedor?',
      action: async () => {
        try {
          await api.delete(`/suppliers/${id}`);
          await fetchSuppliers();
        } catch (deleteError) {
          console.error(deleteError);
          setError('Erro ao excluir fornecedor.');
        } finally {
          setConfirmModal((current) => ({ ...current, isOpen: false }));
        }
      },
    });
  }, [fetchSuppliers]);

  const columns = useMemo<TableColumn<Supplier>[]>(
    () => [
      {
        id: 'companyName',
        label: 'Razao social',
        sortable: true,
        sortKey: 'companyName',
        cell: (supplier) => (
          <div>
            <p className="max-w-[260px] truncate font-semibold text-slate-800" title={supplier.companyName}>
              {supplier.companyName}
            </p>
            {supplier.tradeName && (
              <p className="max-w-[260px] truncate text-xs text-slate-500" title={supplier.tradeName}>
                {supplier.tradeName}
              </p>
            )}
          </div>
        ),
      },
      {
        id: 'cnpj',
        label: 'CNPJ',
        cell: (supplier) => <span className="font-mono text-xs text-slate-700">{supplier.cnpj}</span>,
      },
      {
        id: 'contact',
        label: 'Contato',
        cell: (supplier) =>
          supplier.contactName || supplier.email || supplier.phone ? (
            <div className="max-w-[260px]">
              {supplier.contactName && <p className="truncate text-sm text-slate-800">{supplier.contactName}</p>}
              {supplier.email && <p className="truncate text-xs text-slate-500">{supplier.email}</p>}
              {supplier.phone && <p className="truncate text-xs text-slate-500">{supplier.phone}</p>}
            </div>
          ) : (
            <span className="text-slate-400">Nao informado</span>
          ),
      },
      {
        id: 'status',
        label: 'Status',
        sortable: true,
        sortKey: 'status',
        cell: (supplier) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              SupplierStatusColors[supplier.status] || 'bg-slate-100 text-slate-800'
            }`}
          >
            {SupplierStatusLabels[supplier.status] || supplier.status}
          </span>
        ),
      },
      {
        id: 'actions',
        label: 'Acoes',
        align: 'right',
        cell: (supplier) => (
          <div className="flex justify-end gap-2">
            <TableActionButton
              icon={Pencil}
              label="Editar fornecedor"
              tone="primary"
              onClick={() => navigate(`/app/suppliers/${supplier.id}/edit`)}
            />
            <TableActionButton
              icon={Trash2}
              label="Excluir fornecedor"
              tone="danger"
              onClick={() => requestDelete(supplier.id)}
            />
          </div>
        ),
      },
    ],
    [navigate, requestDelete],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fornecedores</h1>
          <p className="mt-1 text-sm text-slate-500">Mantenha a base de fornecedores organizada e atualizada.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/app/suppliers/new')}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Novo fornecedor
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
        <div className="xl:col-span-8">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Busca textual
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={formFilters.search}
              onChange={(event) =>
                setFormFilters((previous) => ({ ...previous, search: event.target.value }))
              }
              className={`${TABLE_FILTER_CONTROL_CLASS} pl-9`}
              placeholder="Razao social, nome fantasia ou CNPJ"
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
            {Object.entries(SupplierStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
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
          onRetry={fetchSuppliers}
          sort={sort}
          onSortChange={(nextSort) => {
            setSort(nextSort);
            setPage(1);
          }}
          hasActiveFilters={hasActiveFilters}
          emptyTitle="Nenhum fornecedor cadastrado"
          emptyDescription="Cadastre fornecedores para comecar a associar compras."
          noResultsTitle="Nenhum fornecedor encontrado"
          noResultsDescription="Nenhum registro corresponde aos filtros aplicados."
          minWidthClassName="min-w-[980px]"
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
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal((current) => ({ ...current, isOpen: false }))}
      />
    </div>
  );
}
