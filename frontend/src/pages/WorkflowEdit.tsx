import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Plus, Trash2, User as UserIcon } from 'lucide-react';
import api from '../services/api';

type Department = {
  id: string;
  name: string;
  isActive?: boolean;
};

type User = {
  id: string;
  name: string;
  isActive?: boolean;
  role?: { id: string; name: string };
  departments?: { id: string; name: string }[];
};

type WorkflowResponse = {
  id: string;
  departmentId: string;
  finalAction?: string;
  version?: number;
  isActive: boolean;
  steps: {
    id: string;
    stepOrder: number;
    approverUserId: string | null;
    approverRoleId: string | null;
  }[];
  buyers: { userId: string }[];
};

type WorkflowStepForm = {
  stepOrder: number;
  approverRoleId: string | null;
  approverUserId: string | null;
};

export function WorkflowEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditing = Boolean(id && id !== 'new');

  const queryParams = new URLSearchParams(location.search);
  const presetDepartmentId = queryParams.get('departmentId');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [existingWorkflows, setExistingWorkflows] = useState<WorkflowResponse[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    departmentId: presetDepartmentId || '',
    buyerUserIds: [] as string[],
    finalAction: 'BUYER_CLOSE',
    steps: [
      {
        stepOrder: 1,
        approverRoleId: null,
        approverUserId: null,
      },
    ] as WorkflowStepForm[],
  });

  useEffect(() => {
    void loadDependencies();
  }, []);

  useEffect(() => {
    if (isEditing) {
      void loadWorkflow();
    }
  }, [id, isEditing]);

  const loadDependencies = async () => {
    try {
      const [departmentResponse, userResponse, workflowResponse] = await Promise.all([
        api.get('/departments?activeOnly=true'),
        api.get('/users'),
        api.get('/workflows'),
      ]);

      const departmentPayload = Array.isArray(departmentResponse.data)
        ? departmentResponse.data
        : departmentResponse.data?.data;
      const userPayload = Array.isArray(userResponse.data) ? userResponse.data : userResponse.data?.data;
      const workflowPayload = Array.isArray(workflowResponse.data)
        ? workflowResponse.data
        : workflowResponse.data?.data;

      setDepartments(Array.isArray(departmentPayload) ? departmentPayload : []);
      setUsers(Array.isArray(userPayload) ? userPayload : []);
      setExistingWorkflows(Array.isArray(workflowPayload) ? workflowPayload : []);
    } catch (dependencyError) {
      console.error('Failed to load workflow dependencies', dependencyError);
      setFeedbackMsg({ type: 'error', text: 'Nao foi possivel carregar os dados de apoio.' });
    }
  };

  const loadWorkflow = async () => {
    try {
      setFetching(true);
      const response = await api.get(`/workflows/${id}`);
      const current: WorkflowResponse = response.data;

      if (!current) {
        setFeedbackMsg({ type: 'error', text: 'Fluxo nao encontrado.' });
        return;
      }

      const loadedBuyerIds = (current.buyers ?? []).map((b) => b.userId);
      const loadedSteps =
        current.steps.length > 0
          ? current.steps
              .sort((a, b) => a.stepOrder - b.stepOrder)
              .map((step) => ({
                stepOrder: step.stepOrder,
                approverRoleId: null as string | null,
                approverUserId: step.approverUserId || null,
              }))
          : [{ stepOrder: 1, approverRoleId: null, approverUserId: null }];

      const nextFormData = {
        departmentId: current.departmentId,
        buyerUserIds: loadedBuyerIds,
        finalAction: current.finalAction || 'BUYER_CLOSE',
        steps: loadedSteps,
      };

      setFormData(nextFormData);
      setInitialSnapshot(buildWorkflowSnapshot(nextFormData));
    } catch (workflowError) {
      console.error(workflowError);
      setFeedbackMsg({ type: 'error', text: 'Erro ao carregar o fluxo selecionado.' });
    } finally {
      setFetching(false);
    }
  };

  const workflowDepartmentOwnerById = useMemo(
    () =>
      new Map(
        existingWorkflows.map((wf) => [wf.departmentId, wf.id]),
      ),
    [existingWorkflows],
  );

  const departmentUsers = useMemo(
    () =>
      users.filter((user) =>
        user.departments?.some((department) => department.id === formData.departmentId),
      ),
    [formData.departmentId, users],
  );

  const buyerCandidates = useMemo(
    () =>
      departmentUsers.filter(
        (user) => user.isActive !== false && normalizeRoleName(user.role?.name) === 'COMPRADOR',
      ),
    [departmentUsers],
  );

  const approverCandidates = useMemo(
    () =>
      departmentUsers.filter(
        (user) => user.isActive !== false && normalizeRoleName(user.role?.name) === 'APROVADOR',
      ),
    [departmentUsers],
  );

  useEffect(() => {
    setFormData((previous) => {
      if (!previous.departmentId) {
        return previous;
      }

      const buyerUserIdSet = new Set(buyerCandidates.map((user) => user.id));
      const approverUserIdSet = new Set(approverCandidates.map((user) => user.id));
      const nextBuyerIds = previous.buyerUserIds.filter((buyerUserId) => buyerUserIdSet.has(buyerUserId));
      const nextSteps = previous.steps.map((step) => {
        if (step.approverUserId && !approverUserIdSet.has(step.approverUserId)) {
          return { ...step, approverUserId: null, approverRoleId: null };
        }
        return step;
      });

      const sameBuyers =
        nextBuyerIds.length === previous.buyerUserIds.length &&
        nextBuyerIds.every((buyerUserId, index) => buyerUserId === previous.buyerUserIds[index]);
      const sameSteps = nextSteps.every(
        (step, index) =>
          step.approverUserId === previous.steps[index]?.approverUserId &&
          step.approverRoleId === previous.steps[index]?.approverRoleId &&
          step.stepOrder === previous.steps[index]?.stepOrder,
      );

      if (sameBuyers && sameSteps) {
        return previous;
      }

      return {
        ...previous,
        buyerUserIds: nextBuyerIds,
        steps: nextSteps,
      };
    });
  }, [approverCandidates, buyerCandidates]);

  const isDepartmentLocked = Boolean(presetDepartmentId) || isEditing;
  const currentSnapshot = useMemo(() => buildWorkflowSnapshot(formData), [formData]);
  const hasChanges = !isEditing || !initialSnapshot || currentSnapshot !== initialSnapshot;

  const handleAddStep = () => {
    if (formData.steps.length >= 10) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      steps: [
        ...previous.steps,
        {
          stepOrder: previous.steps.length + 1,
          approverRoleId: null,
          approverUserId: null,
        },
      ],
    }));
  };

  const handleRemoveStep = (indexToRemove: number) => {
    setFormData((previous) => ({
      ...previous,
      steps: previous.steps
        .filter((_, index) => index !== indexToRemove)
        .map((step, index) => ({ ...step, stepOrder: index + 1 })),
    }));
  };

  const handleStepChange = (index: number, value: string) => {
    setFormData((previous) => {
      const nextSteps = [...previous.steps];
      nextSteps[index] = {
        ...nextSteps[index],
        approverUserId: value || null,
        approverRoleId: null,
      };

      return { ...previous, steps: nextSteps };
    });
  };

  const toggleBuyer = (buyerUserId: string) => {
    setFormData((previous) => ({
      ...previous,
      buyerUserIds: previous.buyerUserIds.includes(buyerUserId)
        ? previous.buyerUserIds.filter((currentId) => currentId !== buyerUserId)
        : [...previous.buyerUserIds, buyerUserId],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedbackMsg(null);

    if (!formData.departmentId) {
      setFeedbackMsg({ type: 'error', text: 'Selecione um departamento.' });
      return;
    }

    if (formData.buyerUserIds.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'Selecione ao menos um comprador do departamento.' });
      return;
    }

    const invalidStep = formData.steps.find((step) => !step.approverUserId);
    if (invalidStep) {
      setFeedbackMsg({
        type: 'error',
        text: `A etapa ${invalidStep.stepOrder} precisa de um aprovador por usuario.`,
      });
      return;
    }

    if (isEditing && !hasChanges) {
      setFeedbackMsg({ type: 'error', text: 'Nenhuma alteracao foi feita neste fluxo.' });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        departmentId: formData.departmentId,
        buyerUserIds: formData.buyerUserIds,
        finalAction: formData.finalAction,
        steps: formData.steps.map((s) => ({
          stepOrder: s.stepOrder,
          approverUserId: s.approverUserId || undefined,
          approverRoleId: s.approverRoleId || undefined,
        })),
      };

      if (isEditing) {
        await api.put(`/workflows/${id}`, payload);
      } else {
        await api.post('/workflows', payload);
      }

      navigate('/app/workflows');
    } catch (submitError: any) {
      setFeedbackMsg({ type: 'error', text: submitError.response?.data || 'Erro ao salvar o fluxo.' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-8 text-center text-slate-500">Carregando configuracao do fluxo...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/app/workflows')}
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEditing ? 'Editar fluxo do departamento' : 'Configurar fluxo do departamento'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Defina compradores, ordem de aprovacao e a etapa final do processo.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <p className="font-semibold">Sem fluxo configurado, o departamento fica bloqueado para novos pedidos.</p>
          <p className="mt-1 text-amber-800">
            Use os compradores para o fechamento final quando a ultima etapa precisar retornar para a area de compras.
          </p>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`rounded-md border p-4 text-sm ${
            feedbackMsg.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="border-b border-slate-100 pb-2 text-lg font-bold text-slate-800">
            Configuracao geral
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Departamento</label>
              <select
                required
                disabled={isDepartmentLocked}
                value={formData.departmentId}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    departmentId: event.target.value,
                    buyerUserIds: [],
                  }))
                }
                className="w-full rounded-md border border-slate-300 px-4 py-2 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="" disabled>
                  Selecione o departamento
                </option>
                {departments.map((department) => {
                  const ownerWorkflowId = workflowDepartmentOwnerById.get(department.id);
                  const isOwnedByAnotherWorkflow = Boolean(ownerWorkflowId && ownerWorkflowId !== id);

                  return (
                    <option
                      key={department.id}
                      value={department.id}
                      disabled={isOwnedByAnotherWorkflow}
                    >
                      {department.name}
                      {isOwnedByAnotherWorkflow ? ' (ja configurado)' : ''}
                    </option>
                  );
                })}
              </select>
              {isDepartmentLocked && (
                <p className="mt-1 text-xs text-slate-500">
                  O departamento fica fixo para evitar duplicidade de fluxo.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Etapa final</label>
              <select
                value={formData.finalAction}
                onChange={(event) =>
                  setFormData((previous) => ({ ...previous, finalAction: event.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-4 py-2 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
              >
                <option value="BUYER_CLOSE">Retorna ao comprador para finalizar</option>
                <option value="APPROVE">Conclui na ultima aprovacao</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Use retorno ao comprador quando a area de compras precisar fechar a operacao depois das aprovacoes.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="border-b border-slate-100 pb-2 text-lg font-bold text-slate-800">
            Compradores do departamento
          </h2>

          {!formData.departmentId ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              Selecione o departamento primeiro para escolher os compradores.
            </div>
          ) : buyerCandidates.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
              Nenhum usuario com cargo COMPRADOR esta vinculado a este departamento.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {buyerCandidates.map((user) => {
                const selected = formData.buyerUserIds.includes(user.id);

                return (
                  <label
                    key={user.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
                      selected
                        ? 'border-brand-300 bg-brand-50/60'
                        : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleBuyer(user.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{user.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{user.role?.name || 'Sem cargo'}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Etapas de aprovacao</h2>
              <p className="mt-1 text-sm text-slate-500">
                Defina a ordem das aprovacoes por usuario. Limite maximo de 10 etapas.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddStep}
              disabled={formData.steps.length >= 10}
              className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Adicionar etapa
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {formData.steps.map((step, index) => {
              const isUserAssigned = Boolean(step.approverUserId);

              return (
                <div
                  key={`${step.stepOrder}-${index}`}
                  className="relative rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-brand-100 font-bold text-brand-700">
                        {step.stepOrder}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">Etapa {step.stepOrder}</p>
                        <p className="text-xs text-slate-500">
                          Escolha um usuario com cargo APROVADOR para esta etapa.
                        </p>
                      </div>
                    </div>

                    {formData.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className="rounded-full border border-slate-200 bg-white p-2 text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div
                    className={`rounded-md border bg-white p-4 ${
                      isUserAssigned ? 'border-brand-400 ring-1 ring-brand-300' : 'border-slate-200'
                    }`}
                  >
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <UserIcon className="h-4 w-4 text-slate-400" />
                      Aprovador da etapa
                    </label>
                    <select
                      value={step.approverUserId || ''}
                      onChange={(event) => handleStepChange(index, event.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                    >
                      <option value="">Selecione um aprovador</option>
                      {approverCandidates.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-slate-500">
                      Apenas usuarios com cargo APROVADOR vinculados a este departamento aparecem aqui.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => navigate('/app/workflows')}
            className="rounded-md px-6 py-2.5 font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || (isEditing && !hasChanges)}
            className="rounded-md bg-brand-600 px-8 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar fluxo'}
          </button>
        </div>
      </form>
    </div>
  );
}

function normalizeRoleName(roleName?: string) {
  return roleName?.trim().toUpperCase() || '';
}

function buildWorkflowSnapshot(formData: {
  departmentId: string;
  buyerUserIds: string[];
  finalAction: string;
  steps: WorkflowStepForm[];
}) {
  return JSON.stringify({
    departmentId: formData.departmentId,
    buyerUserIds: [...formData.buyerUserIds].sort(),
    finalAction: formData.finalAction?.trim().toUpperCase() || 'BUYER_CLOSE',
    steps: formData.steps.map((step, index) => ({
      stepOrder: index + 1,
      approverUserId: step.approverUserId || null,
    })),
  });
}
