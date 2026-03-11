import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../services/api';

export function DepartmentCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("O nome do departamento é obrigatório.");
      return;
    }

    try {
      setLoading(true);
      await api.post('/departments', { name: name.trim() });
      alert('Departamento criado com sucesso!');
      navigate('/app/departments');
    } catch (err: any) {
      alert(err.response?.data || 'Erro ao criar departamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/app/departments')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Novo Departamento</h1>
          <p className="text-slate-500 text-sm mt-1">Crie um novo centro de custo para o fluxo de aprovação</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Departamento</label>
            <input
              required
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="Ex: Engenharia de Software"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-8 py-2.5 rounded-md transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Cadastrar Departamento'}
          </button>
        </div>
      </form>
    </div>
  );
}
