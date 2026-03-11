import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Shield, User as UserIcon } from 'lucide-react';
import api from '../services/api';

export function WorkflowEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditing = id && id !== 'new';
  
  // Extract departmentId from query params if creating new
  const queryParams = new URLSearchParams(location.search);
  const presetDepartmentId = queryParams.get('departmentId');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    department_id: presetDepartmentId || '',
    min_amount: 0,
    steps: [] as { step_order: number; approver_role_id: string | null; approver_user_id: string | null }[]
  });

  useEffect(() => {
    loadDependencies();
    if (isEditing) {
      loadWorkflow();
    }
  }, [id]);

  const loadDependencies = async () => {
    try {
      const [deptRes, roleRes, userRes] = await Promise.all([
        api.get('/departments'),
        api.get('/roles'),
        api.get('/users')
      ]);
      setDepartments(deptRes.data || []);
      setRoles(roleRes.data || []);
      setUsers(userRes.data || []);
    } catch (err) {
      console.error('Failed to load dependencies', err);
    }
  };

  const loadWorkflow = async () => {
    try {
      setFetching(true);
      const res = await api.get('/workflows');
      const allWf = res.data || [];
      const current = allWf.find((w: any) => w.workflow.id === id);
      if (current) {
        setFormData({
          department_id: current.workflow.department_id,
          min_amount: current.workflow.min_amount,
          steps: current.steps.map((s: any) => ({
            step_order: s.step_order,
            approver_role_id: s.approver_role_id || null,
            approver_user_id: s.approver_user_id || null
          }))
        });
      }
    } catch (err) {
      alert('Erro ao carregar fluxo');
    } finally {
      setFetching(false);
    }
  };

  const handleAddStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        { step_order: prev.steps.length + 1, approver_role_id: null, approver_user_id: null }
      ]
    }));
  };

  const handleRemoveStep = (indexToRemove: number) => {
    setFormData(prev => {
      const newSteps = prev.steps.filter((_, i) => i !== indexToRemove);
      // Re-order remaining steps
      return {
        ...prev,
        steps: newSteps.map((s, i) => ({ ...s, step_order: i + 1 }))
      };
    });
  };

  const handleStepChange = (index: number, field: 'approver_role_id' | 'approver_user_id', value: string) => {
    setFormData(prev => {
      const newSteps = [...prev.steps];
      if (field === 'approver_role_id') {
        newSteps[index].approver_role_id = value;
        newSteps[index].approver_user_id = null; // Clear the other option
      } else {
        newSteps[index].approver_user_id = value;
        newSteps[index].approver_role_id = null; // Clear the other option
      }
      return { ...prev, steps: newSteps };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department_id) {
      alert('Selecione um departamento.');
      return;
    }
    
    // Validate that every step has either a role or user assigned
    const invalidStep = formData.steps.find(s => !s.approver_role_id && !s.approver_user_id);
    if (invalidStep) {
      alert(`O Passo ${invalidStep.step_order} precisa de um Aprovador (Cargo ou Usuário).`);
      return;
    }

    try {
      setLoading(true);
      if (isEditing) {
        await api.put(`/workflows/${id}`, formData);
      } else {
        await api.post('/workflows', formData);
      }
      navigate('/app/workflows');
    } catch (err: any) {
      alert(err.response?.data || 'Erro ao salvar fluxo.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-center text-slate-500">Carregando dados...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/app/workflows')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEditing ? 'Editar Fluxo' : 'Novo Fluxo de Aprovação'}</h1>
          <p className="text-slate-500 text-sm mt-1">Defina as regras e etapas para liberação de compras</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Configurações Gerais */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Configurações Gerais</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Departamento Alvo</label>
              <select
                required
                disabled={Boolean(presetDepartmentId) || Boolean(isEditing)}
                value={formData.department_id}
                onChange={e => setFormData({...formData, department_id: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="" disabled>Selecione o departamento</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {(Boolean(presetDepartmentId) || Boolean(isEditing)) && (
                <p className="text-xs text-slate-500 mt-1">O departamento não pode ser alterado para esta regra.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor Mínimo (R$)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={formData.min_amount}
                onChange={e => setFormData({...formData, min_amount: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="Ex: 1000.00"
              />
              <p className="text-xs text-slate-500 mt-1">Aplica-se apenas a compras acima deste valor.</p>
            </div>
          </div>
        </div>

        {/* Passos do Fluxo */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-lg font-bold text-slate-800">Cadeia de Aprovação (Passos)</h2>
            <button
              type="button"
              onClick={handleAddStep}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Passo
            </button>
          </div>

          {formData.steps.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm bg-slate-50 rounded-lg border border-slate-200 dashed">
              Nenhuma etapa configurada. As compras serão <strong>Aprovadas Automaticamente</strong>.
            </div>
          ) : (
            <div className="space-y-4">
              {formData.steps.map((step, index) => {
                const isRoleAssigned = step.approver_role_id !== null;
                const isUserAssigned = step.approver_user_id !== null;

                return (
                  <div key={index} className="flex gap-4 p-4 border border-slate-200 rounded-lg bg-slate-50 relative group">
                    <div className="w-8 h-8 shrink-0 bg-brand-100 text-brand-700 font-bold rounded-full flex items-center justify-center border border-brand-200">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      
                      {/* Select Usuário Específico */}
                      <div className={`p-4 rounded-md border bg-white ${isUserAssigned ? 'border-brand-500 ring-1 ring-brand-500 shadow-sm' : 'border-slate-200'}`}>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          Usuário Específico
                        </label>
                        <select
                          value={step.approver_user_id || ''}
                          onChange={e => handleStepChange(index, 'approver_user_id', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-brand-500"
                        >
                          <option value="">(Não utilizar)</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Select Cargo Genérico */}
                      <div className={`p-4 rounded-md border bg-white ${isRoleAssigned ? 'border-brand-500 ring-1 ring-brand-500 shadow-sm' : 'border-slate-200'}`}>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                          <Shield className="w-4 h-4 text-slate-400" />
                          Qualquer pessoa do Cargo
                        </label>
                        <select
                          value={step.approver_role_id || ''}
                          onChange={e => handleStepChange(index, 'approver_role_id', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-brand-500"
                        >
                          <option value="">(Não utilizar)</option>
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveStep(index)}
                      className="absolute -right-3 -top-3 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate('/app/workflows')}
            className="px-6 py-2.5 rounded-md font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-8 py-2.5 rounded-md transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Fluxo'}
          </button>
        </div>
      </form>
    </div>
  );
}
