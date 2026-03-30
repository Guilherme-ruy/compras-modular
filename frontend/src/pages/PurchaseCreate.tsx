import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';

type Item = {
  description: string;
  quantity: number;
  unit_price: number;
};

export function PurchaseCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([{ description: '', quantity: 1, unit_price: 0 }]);
  const [justification, setJustification] = useState('');

  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    api.get('/departments')
      .then(res => setDepartments(res.data || []))
      .catch(err => console.error("Failed to load departments", err));
  }, []);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
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
    if (!selectedDepartment) {
      alert('Selecione um departamento.');
      return;
    }
    if (items.length === 0) {
      alert('Adicione pelo menos um item.');
      return;
    }

    try {
      setLoading(true);
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      const payload = {
        department_id: selectedDepartment,
        total_amount: totalAmount,
        metadata: {
          justificativa: justification,
          prioridade: totalAmount > 5000 ? 'ALTA' : 'MEDIA'
        },
        items: items
      };

      const res = await api.post('/purchases', payload);
      alert('Pedido criado com sucesso como Rascunho!');
      navigate(`/app/purchases/${res.data.id}`);
    } catch (err: any) {
      alert(err.response?.data || 'Erro ao criar pedido.');
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/app/purchases')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Novo Pedido de Compra</h1>
          <p className="text-slate-500 text-sm mt-1">Preencha os dados para criar um rascunho</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Informações Gerais</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Centro de Custo / Departamento</label>
              <select
                required
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-white"
              >
                <option value="" disabled>Para onde vai essa compra?</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
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
                    value={item.unit_price}
                    onChange={e => handleItemChange(index, 'unit_price', Number(e.target.value))}
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
            disabled={loading}
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-8 py-2.5 rounded-md transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Criar Rascunho de Compra'}
          </button>
        </div>
      </form>
    </div>
  );
}
