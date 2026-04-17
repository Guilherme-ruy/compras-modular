import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type Item = {
  description: string;
  link?: string;
  quantity: number;
  unitPrice: number;
};

type Department = {
  id: string;
  name: string;
  isActive?: boolean;
};

export function PurchaseCreate() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([{ description: '', link: '', quantity: 1, unitPrice: 0 }]);
  const [justification, setJustification] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [configuredDepartmentIds, setConfiguredDepartmentIds] = useState<string[]>([]);
  const [workflowLookupReady, setWorkflowLookupReady] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    const fetchSelects = async () => {
        try {
            // Load departments and suppliers
            const [deps, sups] = await Promise.all([
              api.get('/departments'),
              api.get('/suppliers?status=ACTIVE'),
            ]);
            
            const isAdmin = ['SUPERADMIN', 'ADMIN'].includes(user?.roleName?.toUpperCase() || '');

            const departmentRows = Array.isArray(deps.data) ? deps.data : deps.data?.data;
            const supplierRows = Array.isArray(sups.data) ? sups.data : sups.data?.data;

            let filteredDepts = Array.isArray(departmentRows) ? departmentRows : [];
            
            // Filter departments for non-admins based on their linked departments in AuthContext
            if (!isAdmin && user?.departments) {
              filteredDepts = filteredDepts.filter(d => user.departments.includes(d.id));
            }

            setDepartments(filteredDepts);
            setSuppliers(Array.isArray(supplierRows) ? supplierRows : []);

            // Try to load workflows to indicate which departments are blocked/ready
            try {
              const workflows = await api.get('/workflows');
              const workflowRows = Array.isArray(workflows.data) ? workflows.data : workflows.data?.data;
              const workflowDepartmentIds = Array.isArray(workflowRows)
                ? workflowRows.map((row: any) => row.departmentId).filter(Boolean)
                : [];
              setConfiguredDepartmentIds(workflowDepartmentIds);
              setWorkflowLookupReady(true);
            } catch (workflowErr) {
              console.warn("Could not load workflows info", workflowErr);
              setConfiguredDepartmentIds([]);
              setWorkflowLookupReady(false);
            }
        } catch(err) {
            console.error("Failed to load generic data", err);
            setFeedbackMsg({ type: 'error', text: 'Erro ao carregar dados dos departamentos/fornecedores.' });
        }
    };
    if (user) fetchSelects();
  }, [user]);

  useEffect(() => {
    if (isEdit) {
      const fetchPurchase = async () => {
        try {
          const res = await api.get(`/purchases/${id}`);
          const purchase = res.data;
          const currentItems = res.data.items;

          if (purchase.status !== 'DRAFT') {
            setFeedbackMsg({ type: 'error', text: 'Apenas pedidos em rascunho podem ser editados.' });
            navigate(`/app/purchases/${id}`);
            return;
          }

          setSelectedDepartment(purchase.departmentId);
          setSelectedSupplier(purchase.supplierId || '');
          setJustification(purchase.metadata?.justification || purchase.metadata?.justificativa || '');

          if (currentItems && currentItems.length > 0) {
            setItems(currentItems.map((i: any) => ({
              description: i.description,
              link: i.link || '',
              quantity: i.quantity,
              unitPrice: Number(i.unitPrice),
            })));
          }
        } catch (err) {
          console.error("Failed to load purchase", err);
          setFeedbackMsg({ type: 'error', text: 'Erro ao carregar pedido.' });
          setTimeout(() => navigate('/app/purchases'), 2000);
        }
      };
      fetchPurchase();
    }
  }, [id, isEdit, navigate]);

  const handleAddItem = () => {
    setItems([...items, { description: '', link: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    if (!selectedDepartment) {
      setFeedbackMsg({ type: 'error', text: 'Selecione um departamento.' });
      return;
    }
    if (!selectedSupplier) {
      setFeedbackMsg({ type: 'error', text: 'Selecione um fornecedor.' });
      return;
    }
    if (items.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'Adicione pelo menos um item.' });
      return;
    }

    try {
      setLoading(true);
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

      const payload = {
        departmentId: selectedDepartment,
        supplierId: selectedSupplier || undefined,
        totalAmount,
        justification: justification,
        isDraft: true,
        metadata: {
          prioridade: totalAmount > 5000 ? 'ALTA' : 'MEDIA',
        },
        items: items.map((item) => ({
          description: item.description,
          link: item.link,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      if (isEdit) {
        await api.put(`/purchases/${id}`, payload);
        setFeedbackMsg({ type: 'success', text: 'Pedido atualizado com sucesso!' });
        setTimeout(() => navigate(`/app/purchases/${id}`), 1500);
      } else {
        const res = await api.post('/purchases', payload);
        setFeedbackMsg({ type: 'success', text: 'Pedido criado com sucesso como Rascunho!' });
        setTimeout(() => navigate(`/app/purchases/${res.data.id}`), 1500);
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorText = typeof errorData === 'object' 
        ? (Array.isArray(errorData.message) ? errorData.message.join(', ') : (errorData.message || JSON.stringify(errorData))) 
        : (errorData || 'Erro ao processar pedido.');
      setFeedbackMsg({ type: 'error', text: errorText });
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  
  const isAdmin = ['SUPERADMIN', 'ADMIN'].includes(user?.roleName?.toUpperCase() || '');
  const selectedDepartmentBlocked = Boolean(
    !isAdmin &&
    workflowLookupReady &&
    selectedDepartment &&
    !configuredDepartmentIds.includes(selectedDepartment),
  );
  
  const selectedDepartmentData = departments.find((department) => department.id === selectedDepartment);
  const selectedDepartmentInactive = Boolean(
    selectedDepartmentData && selectedDepartmentData.isActive === false,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(isEdit ? `/app/purchases/${id}` : '/app/purchases')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Editar Pedido de Compra' : 'Novo Pedido de Compra'}</h1>
          <p className="text-slate-500 text-sm mt-1">{isEdit ? 'Edite as informações do rascunho' : 'Preencha os dados para criar um rascunho'}</p>
        </div>
      </div>

      {feedbackMsg && (
          <div className={`p-4 rounded-md border text-sm ${feedbackMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              {feedbackMsg.text}
          </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Informações Gerais</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Centro de Custo / Departamento</label>
              <select
                required
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-white"
              >
                <option value="" disabled>Para onde vai essa compra?</option>
                {departments.map(dept => (
                  <option
                    key={dept.id}
                    value={dept.id}
                    disabled={dept.isActive === false}
                  >
                    {dept.name}
                    {dept.isActive === false ? ' (inativo)' : ''}
                    {!isAdmin && workflowLookupReady && !configuredDepartmentIds.includes(dept.id)
                      ? ' (bloqueado - sem fluxo)'
                      : ''}
                  </option>
                ))}
              </select>
              {selectedDepartmentInactive && (
                <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Este departamento esta inativo e nao pode mais receber novos pedidos ou alteracoes de rascunho.
                </div>
              )}
              {selectedDepartmentBlocked && (
                <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Este departamento esta bloqueado para pedidos porque o fluxo de aprovacao ainda nao foi configurado.
                </div>
              )}
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Fornecedor</label>
              <select
                required
                value={selectedSupplier}
                onChange={e => setSelectedSupplier(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-white"
              >
                <option value="" disabled>Selecione um fornecedor ativo</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.companyName} {sup.cnpj && `- ${sup.cnpj}`}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Justificativa</label>
              <textarea
                required
                value={justification}
                onChange={e => setJustification(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                rows={3}
                placeholder="Por que esta compra é necessária?"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">Itens</h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-2 text-brand-600 hover:text-brand-800 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Adicionar Item
            </button>
          </div>

          <div className="p-6 space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
                  <input
                    required
                    type="text"
                    value={item.description}
                    onChange={e => handleItemChange(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                    placeholder="Ex: Notebook Dell"
                  />
                  <input
                    type="url"
                    value={item.link || ''}
                    onChange={e => handleItemChange(index, 'link', e.target.value)}
                    className="w-full mt-2 px-3 py-1.5 border border-slate-200 bg-slate-50 placeholder-slate-400 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none text-xs text-slate-600 font-normal"
                    placeholder="Link do produto (opcional)"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Qtd</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Preço Unit.</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-slate-500 font-medium">Total Estimado</p>
                <p className="text-2xl font-bold text-slate-800">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading || selectedDepartmentBlocked || selectedDepartmentInactive}
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-8 py-2.5 rounded-md transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Rascunho de Compra')}
          </button>
        </div>
      </form>
    </div>
  );
}
