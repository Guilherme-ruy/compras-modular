import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2, Trash2, ArrowRight, Building2, User as UserIcon } from 'lucide-react';
import api from '../services/api';

export function WorkflowList() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wfRes, deptRes, roleRes, userRes] = await Promise.all([
        api.get('/workflows'),
        api.get('/departments'),
        api.get('/roles'),
        api.get('/users')
      ]);
      setWorkflows(wfRes.data || []);
      setDepartments(deptRes.data || []);
      setRoles(roleRes.data || []);
      setUsers(userRes.data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta regra de aprovação?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      fetchData();
    } catch (error) {
      alert('Erro ao excluir fluxo.');
    }
  };

  const getEntityName = (roleId?: string, userId?: string) => {
    if (userId) {
      return users.find(u => u.id === userId)?.name || 'Usuário Desconhecido';
    }
    if (roleId) {
      return roles.find(r => r.id === roleId)?.name || 'Cargo Desconhecido';
    }
    return 'Não atribuído';
  };

  // Helper to find all users that have this department linked (Potentially "Buyers")
  const getDepartmentUsers = (deptId: string) => {
    return users.filter(u => u.departments?.some((d: any) => d.id === deptId));
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando departamentos e fluxos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Regras de Aprovação por Departamento</h1>
          <p className="text-slate-500 text-sm mt-1">Configure o fluxo exigido para cada setor da empresa (1 Regra por Setor)</p>
        </div>
      </div>

      <div className="grid gap-4">
        {departments.length === 0 ? (
          <div className="bg-white border text-center p-12 rounded-xl text-slate-500 shadow-sm border-slate-200">
            Nenhum departamento cadastrado. Crie departamentos primeiro.
          </div>
        ) : (
          departments.map((dept) => {
            const wfData = workflows.find(w => w.workflow.department_id === dept.id);
            const deptUsers = getDepartmentUsers(dept.id);
            
            return (
              <div key={dept.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between flex-wrap gap-4 lg:flex-nowrap">
                
                <div className="space-y-4 flex-1 w-full lg:w-auto">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-50 text-brand-600 rounded-lg shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">
                        {dept.name}
                      </h3>
                      {wfData ? (
                        <p className="text-sm text-slate-500">
                           Exige aprovação para compras a partir de <span className="font-medium text-slate-700">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(wfData.workflow.min_amount)}
                          </span>
                        </p>
                      ) : (
                         <p className="text-sm text-amber-600 font-medium tracking-tight">⚠️ Nenhuma regra configurada. (Aprovação Automática)</p>
                      )}
                    </div>
                  </div>

                  {/* Registered Buyers Section */}
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2 block">Pessoas Neste Setor (Possíveis Compradores):</span>
                    {deptUsers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {deptUsers.map(u => (
                           <div key={u.id} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 flex items-center gap-1.5 cursor-default group" title={u.email}>
                              <UserIcon className="w-3 h-3 text-slate-400 group-hover:text-brand-500" />
                              {u.name}
                           </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Ninguém cadastrado neste departamento.</span>
                    )}
                  </div>

                  {/* Workflow Path Render */}
                  {wfData && (
                    <div className="pt-2 flex items-center gap-2 overflow-x-auto pb-2">
                      <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase mr-2">Cadeia de Aprovação:</span>
                      {wfData.steps.length > 0 ? (
                        wfData.steps.map((step: any, index: number) => (
                          <div key={step.id} className="flex items-center gap-2 shrink-0">
                            <div className="px-3 py-1.5 bg-slate-50 border border-brand-200 rounded-md text-sm font-medium text-brand-800 flex items-center gap-2 shadow-sm">
                              <span className="w-5 h-5 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs">
                                {step.step_order}
                              </span>
                              {getEntityName(step.approver_role_id, step.approver_user_id)}
                            </div>
                            {index < wfData.steps.length - 1 && (
                              <ArrowRight className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-sm italic text-slate-500">Nenhum passo definido. Apenas compras acima de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(wfData.workflow.min_amount)} ficarão retidas até que um Admin aprove.</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 lg:ml-6 shrink-0 lg:w-auto w-full justify-end border-t lg:border-none pt-4 lg:pt-0 border-slate-100">
                  {wfData ? (
                    <>
                      <button
                        onClick={() => navigate(`/app/workflows/${wfData.workflow.id}/edit`)}
                        className="px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-md transition-colors flex items-center gap-2"
                      >
                        <Settings2 className="w-4 h-4" />
                        Editar Roteiro
                      </button>
                      <button
                        onClick={() => handleDelete(wfData.workflow.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Remover Regra"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => navigate(`/app/workflows/new?departmentId=${dept.id}`)}
                      className="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-md transition-colors shadow-sm"
                    >
                      Configurar Regra
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
