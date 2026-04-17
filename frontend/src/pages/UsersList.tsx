import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Pencil, Plus, Search, X } from 'lucide-react';
import api from '../services/api';
import { StandardTable, type TableColumn } from '../components/ui/table/StandardTable';
import { TableActionButton } from '../components/ui/table/TableActionButton';
import { TableFilters, TABLE_FILTER_CONTROL_CLASS } from '../components/ui/table/TableFilters';
import { TablePagination } from '../components/ui/table/TablePagination';
import {
  normalizeListResponse,
  type PageSizeOption,
  type PaginationMeta,
  type SortState,
} from '../utils/pagination';

type User = {
  id: string;
  name: string;
  email: string;
  role?: { id: string; name: string };
  departments?: { id: string; name: string }[];
};

type Role = {
  id: string;
  name: string;
};

type Department = {
  id: string;
  name: string;
};

type UserFilters = {
  search: string;
  roleId: string;
  departmentId: string;
};

const defaultFilters: UserFilters = {
  search: '',
  roleId: '',
  departmentId: '',
};

const defaultSort: SortState = { key: 'name', direction: 'asc' };

export function UsersList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
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

  const [formFilters, setFormFilters] = useState<UserFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<UserFilters>(defaultFilters);
  const [departmentPreviewUser, setDepartmentPreviewUser] = useState<User | null>(null);

  const hasActiveFilters = Boolean(
    appliedFilters.search || appliedFilters.roleId || appliedFilters.departmentId,
  );

  const fetchDependencies = useCallback(async () => {
    try {
      const [rolesResponse, departmentsResponse] = await Promise.all([
        api.get('/roles'),
        api.get('/departments'),
      ]);

      const rolePayload = Array.isArray(rolesResponse.data)
        ? rolesResponse.data
        : rolesResponse.data?.data;
      const departmentPayload = Array.isArray(departmentsResponse.data)
        ? departmentsResponse.data
        : departmentsResponse.data?.data;

      setRoles(Array.isArray(rolePayload) ? rolePayload : []);
      setDepartments(Array.isArray(departmentPayload) ? departmentPayload : []);
    } catch (dependencyError) {
      console.error('Failed to load dependencies', dependencyError);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
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
      if (appliedFilters.roleId) {
        params.set('roleId', appliedFilters.roleId);
      }
      if (appliedFilters.departmentId) {
        params.set('departmentId', appliedFilters.departmentId);
      }

      const response = await api.get(`/users?${params.toString()}`);
      const normalized = normalizeListResponse<User>(response.data, page, perPage);
      setRows(normalized.items);
      setMeta(normalized.meta);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Nao foi possivel carregar os usuarios.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, perPage, sort]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const columns = useMemo<TableColumn<User>[]>(
    () => [
      {
        id: 'name',
        label: 'Nome',
        sortable: true,
        sortKey: 'name',
        cell: (user) => <span className="font-semibold text-slate-800">{user.name}</span>,
      },
      {
        id: 'email',
        label: 'Email',
        sortable: true,
        sortKey: 'email',
        cell: (user) => <span className="max-w-[280px] truncate">{user.email}</span>,
      },
      {
        id: 'departments',
        label: 'Departamentos',
        cell: (user) =>
          user.departments && user.departments.length > 0 ? (
            <button
              type="button"
              onClick={() => setDepartmentPreviewUser(user)}
              className="group max-w-[280px] text-left"
            >
              <div className="flex flex-wrap gap-1">
                {user.departments.slice(0, 2).map((department) => (
                  <span
                    key={department.id}
                    className="rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                  >
                    {department.name}
                  </span>
                ))}
                {user.departments.length > 2 && (
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    +{user.departments.length - 2}
                  </span>
                )}
              </div>
              <span className="mt-1 inline-flex text-xs font-medium text-slate-500 transition-colors group-hover:text-brand-700">
                {user.departments.length} departamento(s) vinculado(s) - ver lista
              </span>
            </button>
          ) : (
            <span className="text-xs text-slate-400">Nao vinculado</span>
          ),
      },
      {
        id: 'role',
        label: 'Cargo',
        sortable: true,
        sortKey: 'role',
        cell: (user) => (
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {user.role?.name || 'Sem cargo'}
          </span>
        ),
      },
      {
        id: 'actions',
        label: 'Acoes',
        align: 'right',
        className: 'w-[88px]',
        headerClassName: 'w-[88px]',
        cell: (user) => (
          <div className="flex justify-end">
            <TableActionButton
              icon={Pencil}
              label={`Editar ${user.name}`}
              onClick={() => navigate(`/app/users/${user.id}/edit`)}
              tone="primary"
            />
          </div>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
          <p className="mt-1 text-sm text-slate-500">Gerencie acessos, cargos e departamentos.</p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/app/users/new')}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Novo usuario
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
        <div className="xl:col-span-5">
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
              placeholder="Nome ou email"
            />
          </div>
        </div>

        <div className="xl:col-span-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cargo
          </label>
          <select
            value={formFilters.roleId}
            onChange={(event) =>
              setFormFilters((previous) => ({ ...previous, roleId: event.target.value }))
            }
            className={TABLE_FILTER_CONTROL_CLASS}
          >
            <option value="">Todos</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="xl:col-span-3">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Departamento
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
          onRetry={fetchUsers}
          sort={sort}
          onSortChange={(nextSort) => {
            setSort(nextSort);
            setPage(1);
          }}
          hasActiveFilters={hasActiveFilters}
          emptyTitle="Nenhum usuario cadastrado"
          emptyDescription="Cadastre usuarios para distribuir responsabilidades no fluxo."
          noResultsTitle="Nenhum usuario encontrado"
          noResultsDescription="Nao houve correspondencia para os filtros aplicados."
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

      {departmentPreviewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="rounded-full border border-brand-100 bg-brand-50 p-2 text-brand-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Departamentos permitidos
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {departmentPreviewUser.name} possui {departmentPreviewUser.departments?.length || 0} departamento(s) vinculado(s).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDepartmentPreviewUser(null)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Fechar visualizacao de departamentos"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              {departmentPreviewUser.departments && departmentPreviewUser.departments.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {departmentPreviewUser.departments.map((department) => (
                    <div
                      key={department.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-slate-800">{department.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Este usuario nao possui departamentos vinculados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
