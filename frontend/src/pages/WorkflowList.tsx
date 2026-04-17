import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
};

type Role = {
  id: string;
  name: string;
};

type User = {
  id: string;
  name: string;
  isActive?: boolean;
  role?: { id: string; name: string };
  departments?: { id: string; name: string }[];
};

type WorkflowStep = {
  id: string;
  stepOrder: number;
  approverRoleId: string | null;
  approverUserId: string | null;
};

type WorkflowConfig = {
  id: string;
  departmentId: string;
  version?: number;
  finalAction?: string;
  isActive: boolean;
  steps: WorkflowStep[];
  buyers: { userId: string }[];
  department: { id: string; name: string };
};

type WorkflowDepartmentRow = {
  department: Department;
  workflow: WorkflowConfig | null;
};

const defaultSort: SortState = { key: 'name', direction: 'asc' };

export function WorkflowList() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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

  const [searchInput, setSearchInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => { },
  });

  const hasActiveFilters = Boolean(searchFilter);

  const roleNameById = useMemo(() => new Map(roles.map((role) => [role.id, role.name])), [roles]);
  const userNameById = useMemo(() => new Map(users.map((user) => [user.id, user.name])), [users]);

  const workflowByDepartmentId = useMemo(
    () => new Map(workflows.map((workflow) => [workflow.departmentId, workflow])),
    [workflows],
  );

  const rows = useMemo<WorkflowDepartmentRow[]>(
    () =>
      departments.map((department) => ({
        department,
        workflow: workflowByDepartmentId.get(department.id) || null,
      })),
    [departments, workflowByDepartmentId],
  );

  const fetchDependencies = useCallback(async () => {
    try {
      const [workflowResponse, roleResponse, userResponse] = await Promise.all([
        api.get('/workflows'),
        api.get('/roles'),
        api.get('/users'),
      ]);

      const workflowPayload = Array.isArray(workflowResponse.data)
        ? workflowResponse.data
        : workflowResponse.data?.data;
      const rolePayload = Array.isArray(roleResponse.data) ? roleResponse.data : roleResponse.data?.data;
      const userPayload = Array.isArray(userResponse.data) ? userResponse.data : userResponse.data?.data;

      setWorkflows(Array.isArray(workflowPayload) ? workflowPayload : []);
      setRoles(Array.isArray(rolePayload) ? rolePayload : []);
      setUsers(Array.isArray(userPayload) ? userPayload : []);
    } catch (dependencyError) {
      console.error('Error fetching workflow dependencies', dependencyError);
    }
  }, []);

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

      params.set('activeOnly', 'true');

      const response = await api.get(`/departments?${params.toString()}`);
      const normalized = normalizeListResponse<Department>(response.data, page, perPage);
      setDepartments(normalized.items);
      setMeta(normalized.meta);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Nao foi possivel carregar os departamentos para configuracao.');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, searchFilter, sort]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const getStepLabel = useCallback((step: WorkflowStep) => {
    if (step.approverUserId && userNameById.has(step.approverUserId)) {
      return userNameById.get(step.approverUserId);
    }
    if (step.approverRoleId && roleNameById.has(step.approverRoleId)) {
      return roleNameById.get(step.approverRoleId);
    }
    return 'Aprovador nao configurado';
  }, [roleNameById, userNameById]);

  const getBuyerLabels = useCallback((buyers?: { userId: string }[]) => {
    if (!Array.isArray(buyers) || buyers.length === 0) {
      return [];
    }

    return buyers.map((b) => userNameById.get(b.userId) || b.userId);
  }, [userNameById]);

  const getWorkflowHealth = useCallback((workflow: WorkflowConfig | null) => {
    if (!workflow) {
      return ['Sem fluxo configurado'];
    }

    const issues: string[] = [];
    const buyers = Array.isArray(workflow.buyers) ? workflow.buyers : [];

    if (buyers.length === 0) {
      issues.push('Sem comprador');
    }

    buyers.forEach((b) => {
      const buyer = users.find((user) => user.id === b.userId);
      if (!buyer) {
        issues.push('Comprador removido');
        return;
      }
      if (!buyer.isActive) {
        issues.push(`Comprador inativo: ${buyer.name}`);
      }
      if (buyer.role?.name?.toUpperCase() !== 'COMPRADOR') {
        issues.push(`Cargo invalido no comprador: ${buyer.name}`);
      }
    });

    if (workflow.steps.length === 0) {
      issues.push('Sem etapa de aprovacao');
    }

    workflow.steps.forEach((step) => {
      if (!step.approverUserId) {
        issues.push(`Etapa ${step.stepOrder} sem aprovador`);
        return;
      }

      const approver = users.find((user) => user.id === step.approverUserId);
      if (!approver) {
        issues.push(`Etapa ${step.stepOrder} com usuario removido`);
        return;
      }
      if (!approver.isActive) {
        issues.push(`Etapa ${step.stepOrder} com aprovador inativo`);
      }
      if (approver.role?.name?.toUpperCase() !== 'APROVADOR') {
        issues.push(`Etapa ${step.stepOrder} com cargo invalido`);
      }
    });

    return Array.from(new Set(issues));
  }, [users]);

  const fetchPageData = useCallback(async () => {
    await Promise.all([fetchDependencies(), fetchDepartments()]);
  }, [fetchDependencies, fetchDepartments]);

  const requestDelete = useCallback((workflowId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remover fluxo',
      message:
        'Ao remover este fluxo, o departamento ficara bloqueado para novos pedidos ate uma nova configuracao.',
      action: async () => {
        try {
          await api.delete(`/workflows/${workflowId}`);
          await fetchPageData();
        } catch (deleteError) {
          console.error(deleteError);
          setError('Erro ao remover o fluxo do departamento.');
        } finally {
          setConfirmModal((current) => ({ ...current, isOpen: false }));
        }
      },
    });
  }, [fetchPageData]);

  const columns = useMemo<TableColumn<WorkflowDepartmentRow>[]>(
    () => [
      {
        id: 'department',
        label: 'Departamento',
        sortable: true,
        sortKey: 'name',
        cell: (row) => <span className="font-semibold text-slate-800">{row.department.name}</span>,
      },
      {
        id: 'flow',
        label: 'Fluxo atual',
        cell: (row) => {
          if (!row.workflow) {
            return (
              <div className="space-y-2">
                <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                  Bloqueado sem fluxo
                </span>
                <p className="text-xs text-slate-500">
                  Configure compradores e aprovadores para liberar pedidos deste departamento.
                </p>
              </div>
            );
          }

          const buyers = getBuyerLabels(row.workflow.buyers);
          const sortedSteps = [...row.workflow.steps].sort((left, right) => left.stepOrder - right.stepOrder);

          return (
            <div className="max-w-[420px] space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Configurado
                </span>
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  v{row.workflow.version || 1}
                </span>
                <span className="text-xs text-slate-500">
                  {row.workflow.finalAction === 'APPROVE'
                    ? 'Conclui na ultima aprovacao'
                    : 'Retorna ao comprador'}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Compradores
                </p>
                <p className="text-sm text-slate-700">
                  {buyers.length > 0 ? buyers.join(', ') : 'Nao configurado'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sequencia de aprovacao
                </p>
                <div className="space-y-1">
                  {sortedSteps.map((step) => (
                    <p key={step.id} className="truncate text-sm text-slate-700">
                      <span className="font-semibold text-slate-800">{step.stepOrder}.</span>{' '}
                      {getStepLabel(step)}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: 'health',
        label: 'Saude do fluxo',
        cell: (row) => {
          const issues = getWorkflowHealth(row.workflow);

          return (
            <div className="flex max-w-[280px] flex-wrap gap-1.5">
              {issues.length === 0 ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Saudavel
                </span>
              ) : (
                issues.map((issue) => (
                  <span
                    key={issue}
                    className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"
                  >
                    {issue}
                  </span>
                ))
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        label: 'Acoes',
        align: 'right',
        cell: (row) => (
          <div className="flex justify-end gap-2">
            <TableActionButton
              icon={row.workflow ? Pencil : Plus}
              label={row.workflow ? 'Editar fluxo' : 'Configurar fluxo'}
              tone="primary"
              onClick={() =>
                row.workflow
                  ? navigate(`/app/workflows/${row.workflow.id}/edit`)
                  : navigate(`/app/workflows/new?departmentId=${row.department.id}`)
              }
            />
            {row.workflow && (
              <TableActionButton
                icon={Trash2}
                label="Remover fluxo"
                tone="danger"
                onClick={() => requestDelete(row.workflow!.id)}
              />
            )}
          </div>
        ),
      },
    ],
    [getBuyerLabels, getStepLabel, getWorkflowHealth, navigate, requestDelete],
  );

  const blockedDepartmentsOnPage = rows.filter((row) => !row.workflow).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fluxos de aprovacao</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cada departamento precisa de um unico fluxo para poder gerar pedidos.
          </p>
        </div>
      </div>

      <TableFilters
        onApply={() => {
          setSearchFilter(searchInput);
          setPage(1);
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
          rowKey={(row) => row.department.id}
          loading={loading}
          error={error}
          onRetry={fetchPageData}
          sort={sort}
          onSortChange={(nextSort) => {
            setSort(nextSort);
            setPage(1);
          }}
          hasActiveFilters={hasActiveFilters}
          emptyTitle="Nenhum departamento cadastrado"
          emptyDescription="Crie departamentos para configurar os fluxos de aprovacao."
          noResultsTitle="Nenhum departamento encontrado"
          noResultsDescription="A busca aplicada nao retornou resultados."
          minWidthClassName="min-w-[1120px]"
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
