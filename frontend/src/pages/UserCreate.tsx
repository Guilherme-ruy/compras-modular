import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Loader2, Save, Search, ShieldAlert, X } from 'lucide-react';
import api from '../services/api';

type Role = {
  id: string;
  name: string;
};

type Department = {
  id: string;
  name: string;
};

type UserResponse = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  role?: {
    id: string;
    name: string;
  };
  departments?: Department[];
};

type UserFormData = {
  name: string;
  email: string;
  password: string;
  roleId: string;
  departmentIds: string[];
};

type UserImpactPreview = {
  blockingReasons: string[];
  warnings: string[];
  summary: {
    removedDepartments: number;
    activeWorkflowApproverAssignments: number;
    pendingApprovalsAtRemovedDepartment: number;
    activeWorkflowBuyerAssignments: number;
    historicalPurchasesInRemovedDept: number;
  };
};

const defaultFormData: UserFormData = {
  name: '',
  email: '',
  password: '',
  roleId: '',
  departmentIds: [],
};

export function UserCreate() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [impactPreview, setImpactPreview] = useState<UserImpactPreview | null>(null);
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [rolesRes, deptRes] = await Promise.all([api.get('/roles'), api.get('/departments')]);

        const rolePayload = Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data?.data;
        const departmentPayload = Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.data;

        setRoles(Array.isArray(rolePayload) ? rolePayload : []);
        setDepartments(Array.isArray(departmentPayload) ? departmentPayload : []);
      } catch (dependencyError) {
        console.error('Failed to load select data', dependencyError);
        setError('Nao foi possivel carregar cargos e departamentos.');
      }
    };

    loadDependencies();
  }, []);

  useEffect(() => {
    if (!isEditing || !id) {
      setInitialLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        const response = await api.get<UserResponse>(`/admin/users/${id}`);
        const user = response.data;

        setFormData({
          name: user.name || '',
          email: user.email || '',
          password: '',
          roleId: user.role?.id || user.roleId || '',
          departmentIds: user.departments?.map((department) => department.id) || [],
        });
      } catch (loadError) {
        console.error(loadError);
        setError('Nao foi possivel carregar o usuario para edicao.');
      } finally {
        setInitialLoading(false);
      }
    };

    loadUser();
  }, [id, isEditing]);

  const selectedDepartments = useMemo(() => {
    const selectedIds = new Set(formData.departmentIds);
    return departments.filter((department) => selectedIds.has(department.id));
  }, [departments, formData.departmentIds]);

  const filteredDepartments = useMemo(
    () =>
      departments.filter((department) =>
        department.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [departments, searchTerm],
  );

  const toggleDepartmentSelection = (departmentId: string) => {
    setFormData((previous) => {
      const isSelected = previous.departmentIds.includes(departmentId);
      return {
        ...previous,
        departmentIds: isSelected
          ? previous.departmentIds.filter((idValue) => idValue !== departmentId)
          : [...previous.departmentIds, departmentId],
      };
    });
  };

  const saveUser = async () => {
    if (isEditing && id) {
      await api.put(`/admin/users/${id}`, formData);
      alert('Usuario atualizado com sucesso!');
    } else {
      await api.post('/users', formData);
      alert('Usuario criado com sucesso!');
    }

    navigate('/app/users');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.roleId) {
      alert('Selecione um Cargo.');
      return;
    }

    if (!isEditing) {
      try {
        setLoading(true);
        await saveUser();
      } catch (requestError: any) {
        const errorData = requestError.response?.data;
        const errorText = typeof errorData === 'object' 
          ? (Array.isArray(errorData.message) ? errorData.message.join(', ') : (errorData.message || JSON.stringify(errorData))) 
          : (errorData || 'Erro ao salvar usuario.');
        alert(errorText);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      const response = await api.post<UserImpactPreview>(`/admin/users/${id}/impact`, formData);
      const preview = response.data;
      setImpactPreview(preview);

      if (preview.blockingReasons.length > 0 || preview.warnings.length > 0) {
        setIsImpactModalOpen(true);
        return;
      }

      await saveUser();
    } catch (requestError: any) {
      const errorData = requestError.response?.data;
      const errorText = typeof errorData === 'object' 
        ? (Array.isArray(errorData.message) ? errorData.message.join(', ') : (errorData.message || JSON.stringify(errorData))) 
        : (errorData || 'Erro ao validar a alteracao do usuario.');
      alert(errorText);
    } finally {
      setLoading(false);
    }
  };

  const confirmImpactAndSave = async () => {
    try {
      setLoading(true);
      await saveUser();
    } catch (requestError: any) {
      alert(requestError.response?.data || 'Erro ao salvar usuario.');
    } finally {
      setLoading(false);
      setIsImpactModalOpen(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          Carregando usuario...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/app/users')}
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEditing ? 'Editar Usuario' : 'Novo Usuario'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isEditing
              ? 'Ajuste cargo, e-mail e departamentos sem perder o controle de impacto.'
              : 'Crie credenciais e defina os acessos.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Nome Completo</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(event) =>
                  setFormData((previous) => ({ ...previous, name: event.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-4 py-2 outline-none transition-colors focus:border-brand-500 focus:ring-brand-500"
                placeholder="Digite o nome..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(event) =>
                  setFormData((previous) => ({ ...previous, email: event.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-4 py-2 outline-none transition-colors focus:border-brand-500 focus:ring-brand-500"
                placeholder="email@empresa.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {isEditing ? 'Nova Senha' : 'Senha Provisoria'}
              </label>
              <input
                required={!isEditing}
                type="password"
                minLength={isEditing ? undefined : 6}
                value={formData.password}
                onChange={(event) =>
                  setFormData((previous) => ({ ...previous, password: event.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-4 py-2 outline-none transition-colors focus:border-brand-500 focus:ring-brand-500"
                placeholder={
                  isEditing ? 'Preencha apenas se quiser alterar' : 'Minimo 6 caracteres'
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Cargo (Nivel de Acesso)
              </label>
              <select
                required
                value={formData.roleId}
                onChange={(event) =>
                  setFormData((previous) => ({ ...previous, roleId: event.target.value }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 outline-none transition-colors focus:border-brand-500 focus:ring-brand-500"
              >
                <option value="" disabled>
                  Selecione um Cargo
                </option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Departamentos Atribuidos
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {formData.departmentIds.length} departamento(s) selecionado(s)
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Use a selecao abaixo para definir em quais centros de custo o usuario atua.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDepartmentModalOpen(true)}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Selecionar Departamentos
                </button>
              </div>

              {selectedDepartments.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedDepartments.slice(0, 8).map((department) => (
                    <span
                      key={department.id}
                      className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                    >
                      {department.name}
                    </span>
                  ))}
                  {selectedDepartments.length > 8 && (
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      +{selectedDepartments.length - 8} restante(s)
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Nenhum departamento selecionado.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-8 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEditing ? 'Salvar Alteracoes' : 'Cadastrar Usuario'}
            </button>
          </div>
        </div>
      </form>

      {isDepartmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Selecionar Departamentos</h3>
                <p className="text-sm text-slate-500">Atribua os departamentos para este usuario</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDepartmentModalOpen(false)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-hidden p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar departamento..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-4 outline-none transition-colors focus:border-brand-500 focus:ring-brand-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto rounded-md border border-slate-200">
                {filteredDepartments.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Nenhum departamento encontrado.
                  </div>
                ) : (
                  <table className="w-full min-w-[620px] text-left text-sm text-slate-700">
                    <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="w-16 px-4 py-3 text-center font-semibold">Sel.</th>
                        <th className="px-4 py-3 font-semibold">Nome do Departamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDepartments.map((department) => {
                        const isSelected = formData.departmentIds.includes(department.id);
                        return (
                          <tr
                            key={department.id}
                            onClick={(event) => {
                              if ((event.target as HTMLElement).tagName.toLowerCase() === 'input') {
                                return;
                              }
                              toggleDepartmentSelection(department.id);
                            }}
                            className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50/70 ${
                              isSelected ? 'bg-brand-50/50' : ''
                            }`}
                          >
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleDepartmentSelection(department.id)}
                                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                              />
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700">
                              {department.name}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-b-xl border-t border-slate-100 bg-slate-50 p-6">
              <span className="text-sm font-medium text-slate-600">
                {formData.departmentIds.length} selecionado(s)
              </span>
              <button
                type="button"
                onClick={() => setIsDepartmentModalOpen(false)}
                className="rounded-md bg-brand-600 px-6 py-2 font-medium text-white transition-colors hover:bg-brand-700"
              >
                Concluir Selecao
              </button>
            </div>
          </div>
        </div>
      )}

      {isImpactModalOpen && impactPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-full p-2 ${
                    impactPreview.blockingReasons.length > 0
                      ? 'border border-red-200 bg-red-50 text-red-700'
                      : 'border border-amber-200 bg-amber-50 text-amber-700'
                  }`}
                >
                  {impactPreview.blockingReasons.length > 0 ? (
                    <ShieldAlert className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {impactPreview.blockingReasons.length > 0
                      ? 'Alteracao bloqueada por risco operacional'
                      : 'Revise o impacto antes de salvar'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {impactPreview.blockingReasons.length > 0
                      ? 'A mudanca solicitada pode interromper fluxos ativos ou aprovacoes pendentes.'
                      : 'A alteracao e permitida, mas ha efeitos colaterais que merecem confirmacao.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-5">
              {impactPreview.blockingReasons.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-red-800">Bloqueios</p>
                  <ul className="space-y-2 text-sm text-red-700">
                    {impactPreview.blockingReasons.map((reason) => (
                      <li key={reason}>- {reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {impactPreview.warnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-amber-900">Avisos</p>
                  <ul className="space-y-2 text-sm text-amber-800">
                    {impactPreview.warnings.map((warning) => (
                      <li key={warning}>- {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <ImpactCard
                  label="Departamentos removidos"
                  value={impactPreview.summary.removedDepartments}
                />
                <ImpactCard
                  label="Fluxos com aprovador"
                  value={impactPreview.summary.activeWorkflowApproverAssignments}
                />
                <ImpactCard
                  label="Aprovacoes pendentes"
                  value={impactPreview.summary.pendingApprovalsAtRemovedDepartment}
                />
                <ImpactCard
                  label="Fluxos com comprador"
                  value={impactPreview.summary.activeWorkflowBuyerAssignments}
                />
                <ImpactCard
                  label="Pedidos antigos afetados"
                  value={impactPreview.summary.historicalPurchasesInRemovedDept}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsImpactModalOpen(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                {impactPreview.blockingReasons.length > 0 ? 'Entendi' : 'Cancelar'}
              </button>
              {impactPreview.blockingReasons.length === 0 && (
                <button
                  type="button"
                  onClick={confirmImpactAndSave}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar Mesmo Assim
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ImpactCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}
