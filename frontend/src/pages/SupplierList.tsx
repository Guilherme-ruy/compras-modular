import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Edit2, ToggleLeft, ToggleRight, Trash2, Search, Filter, X } from 'lucide-react';
import api from '../services/api';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export type Supplier = {
  id: string;
  company_name: string;
  trade_name: string;
  cnpj: string;
  is_active: boolean;
  contact_name: string;
  email: string;
  phone: string;
};

export function SupplierList() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({ isOpen: false, title: '', message: '', action: async () => { } });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, [statusFilter]); // trigger when status filter changes

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/suppliers?${params.toString()}`);
      setSuppliers(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Erro ao buscar fornecedores.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const action = currentStatus ? 'desativar' : 'ativar';
    setConfirmModal({
      isOpen: true,
      title: `${currentStatus ? 'Desativar' : 'Ativar'} Fornecedor`,
      message: `Tem certeza que deseja ${action} este fornecedor?`,
      action: async () => {
        try {
          await api.patch(`/suppliers/${id}/toggle-active`);
          fetchSuppliers();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error(err);
          alert('Erro ao alterar status.');
        }
      }
    });
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Fornecedor',
      message: 'Tem certeza que deseja excluir este fornecedor?',
      action: async () => {
        try {
          await api.delete(`/suppliers/${id}`);
          fetchSuppliers();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error(err);
          alert('Erro ao excluir.');
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fornecedores</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie os fornecedores cadastrados</p>
        </div>
        <button
          onClick={() => navigate('/app/suppliers/new')}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" /> Novo Fornecedor
        </button>
      </div>

      {/* FILTERS BAR */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
          <div className="space-y-1.5 group">
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 group-focus-within:text-brand-600 transition-colors">
              <Search className="w-3 h-3" />
              Busca (Nome, Nome Fantasia, CNPJ)
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSuppliers()}
              placeholder="Digite e aperte Enter..."
              className="block w-full rounded-lg border-slate-200 bg-slate-50/50 py-2.5 px-3 text-slate-700 font-medium shadow-sm transition-all focus:border-brand-500 focus:ring-brand-500 focus:bg-white sm:text-sm"
            />
          </div>

          <div className="space-y-1.5 group">
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 group-focus-within:text-brand-600 transition-colors">
              <Filter className="w-3 h-3" />
              Status
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-lg border-slate-200 bg-slate-50/50 py-2.5 pl-3 pr-10 text-slate-700 font-medium shadow-sm transition-all focus:border-brand-500 focus:ring-brand-500 focus:bg-white sm:text-sm appearance-none cursor-pointer"
              >
                <option value="">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSuppliers}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
            >
              <Search className="w-4 h-4" />
              Filtrar
            </button>

            {(search || statusFilter) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter(''); setTimeout(() => fetchSuppliers(), 0); }}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600 py-2.5 px-3 transition-colors rounded-lg hover:bg-red-50"
                title="Limpar Filtros"
              >
                <X className="w-4 h-4" />
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando fornecedores...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800">Nenhum fornecedor encontrado</h3>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="py-3 px-6 font-medium">Razão Social</th>
                <th className="py-3 px-6 font-medium">CNPJ</th>
                <th className="py-3 px-6 font-medium">Contato</th>
                <th className="py-3 px-6 font-medium">Status</th>
                <th className="py-3 px-6 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((s) => (
                <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${!s.is_active ? 'opacity-60' : ''}`}>
                  <td className="py-4 px-6 font-medium text-slate-800">
                    {s.company_name}
                    {s.trade_name && <span className="block text-xs text-slate-500 font-normal">{s.trade_name}</span>}
                  </td>
                  <td className="py-4 px-6 text-slate-600">{s.cnpj}</td>
                  <td className="py-4 px-6 text-slate-600">
                    {s.contact_name || s.email ? (
                      <div>
                        {s.contact_name && <span className="block">{s.contact_name}</span>}
                        {s.email && <span className="block text-xs text-slate-500">{s.email}</span>}
                        {s.phone && <span className="block text-xs text-slate-500">{s.phone}</span>}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Não informado</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 text-xs font-semibold rounded uppercase tracking-wider ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {s.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/app/suppliers/${s.id}/edit`)}
                        className="p-1.5 text-brand-600 hover:bg-brand-50 rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(s.id, s.is_active)}
                        className={`p-1.5 rounded ${s.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                        title={s.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {s.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
