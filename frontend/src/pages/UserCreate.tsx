import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X } from 'lucide-react';
import api from '../services/api';

export function UserCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    department_ids: [] as string[]
  });

  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/roles'),
      api.get('/departments')
    ]).then(([rolesRes, deptRes]) => {
      setRoles(rolesRes.data || []);
      setDepartments(deptRes.data || []);
    }).catch(err => {
      console.error("Failed to load select data", err);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role_id) {
      alert("Selecione um Cargo (Role).");
      return;
    }

    try {
      setLoading(true);
      await api.post('/users', formData);
      alert('Usuário criado com sucesso!');
      navigate('/app/users');
    } catch (err: any) {
      alert(err.response?.data || 'Erro ao criar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/app/users')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Novo Usuário</h1>
          <p className="text-slate-500 text-sm mt-1">Crie credenciais e defina os acessos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="Digite o nome..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="email@empresa.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha Provisória</label>
            <input
              required
              type="password"
              minLength={6}
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cargo (Nível de Acesso)</label>
              <select
                required
                value={formData.role_id}
                onChange={e => setFormData({...formData, role_id: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
              >
                <option value="" disabled>Selecione um Cargo</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Departamentos Atribuídos</label>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-md">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {formData.department_ids.length} departamento(s) selecionado(s)
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Clique no botão ao lado para gerenciar as atribuições.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleModal}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Selecionar Departamentos
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-8 py-2.5 rounded-md transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Cadastrar Usuário'}
          </button>
        </div>
      </form>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Selecionar Departamentos</h3>
                <p className="text-sm text-slate-500">Atribua os departamentos para este usuário</p>
              </div>
              <button 
                type="button" 
                onClick={toggleModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-hidden flex flex-col gap-4">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Pesquisar departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>

              {/* Department List */}
              <div className="flex-1 overflow-y-auto border border-slate-200 rounded-md">
                {filteredDepartments.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    Nenhum departamento encontrado.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-medium text-slate-600 w-16 text-center">Sel.</th>
                        <th className="px-4 py-3 font-medium text-slate-600">Nome do Departamento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDepartments.map(d => {
                        const isSelected = formData.department_ids.includes(d.id);
                        return (
                          <tr 
                            key={d.id} 
                            onClick={(e) => {
                              // Prevent double toggle if clicking directly on checkbox
                              if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
                              
                              if (isSelected) {
                                setFormData(prev => ({ ...prev, department_ids: prev.department_ids.filter(id => id !== d.id) }));
                              } else {
                                setFormData(prev => ({ ...prev, department_ids: [...prev.department_ids, d.id] }));
                              }
                            }}
                            className={`cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? 'bg-brand-50/50' : ''}`}
                          >
                            <td className="px-4 py-3 text-center">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({ ...prev, department_ids: [...prev.department_ids, d.id] }));
                                  } else {
                                    setFormData(prev => ({ ...prev, department_ids: prev.department_ids.filter(id => id !== d.id) }));
                                  }
                                }}
                                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700">
                              {d.name}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-xl">
              <span className="text-sm font-medium text-slate-600">
                {formData.department_ids.length} selecionado(s)
              </span>
              <button
                type="button"
                onClick={toggleModal}
                className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-2 rounded-md transition-colors"
              >
                Concluir Seleção
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
