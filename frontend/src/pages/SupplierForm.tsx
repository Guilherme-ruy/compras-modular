import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, DollarSign, Contact, Info, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export function SupplierForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('gerais');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ show: true, message, type });
    if (type !== 'success') {
      // Auto-hide only for non-navigating events, or we rely on the redirect for success
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    }
  };

  const TABS = [
    { id: 'gerais', label: 'Dados Gerais', icon: Building2 },
    { id: 'contatos', label: 'Contatos', icon: Contact },
    { id: 'endereco', label: 'Endereço', icon: MapPin },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'extras', label: 'Extras', icon: Info },
  ];
  const [formData, setFormData] = useState({
    company_name: '',
    trade_name: '',
    cnpj: '',
    state_reg: '',
    is_active: true,

    contact_name: '',
    phone: '',
    email: '',
    com_contact: '',
    fin_contact: '',

    zip_code: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',

    bank: '',
    agency: '',
    account: '',
    pix: '',

    notes: '',
  });

  useEffect(() => {
    if (isEditing) {
      loadSupplier();
    }
  }, [id]);

  const loadSupplier = async () => {
    try {
      const res = await api.get(`/suppliers/${id}`);
      setFormData(res.data);
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar fornecedor. Voltando...', 'error');
      setTimeout(() => navigate('/app/suppliers'), 2000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleMaskCNPJ = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);
    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    setFormData((prev) => ({ ...prev, cnpj: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company_name || !formData.cnpj) {
      showToast('A Razão Social e o CNPJ são obrigatórios.', 'warning');
      setActiveTab('gerais');
      return;
    }

    setLoading(true);

    const payload = { ...formData, cnpj: formData.cnpj.replace(/\D/g, '') };

    try {
      if (isEditing) {
        await api.put(`/suppliers/${id}`, payload);
        showToast('Fornecedor atualizado com sucesso!', 'success');
      } else {
        await api.post('/suppliers', payload);
        showToast('Fornecedor cadastrado com sucesso!', 'success');
      }
      setTimeout(() => navigate('/app/suppliers'), 1500);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data || 'Erro inesperado ao salvar fornecedor.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* TOAST FLUTUANTE */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 text-white font-medium ${
          toast.type === 'error' ? 'bg-red-600' : toast.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-600'
        }`}>
          {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/app/suppliers')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Preencha os dados do fornecedor abaixo</p>
        </div>
      </div>

      <div className="flex bg-white rounded-lg p-1.5 shadow-sm border border-slate-200 gap-1 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all whitespace-nowrap flex-1 justify-center ${activeTab === tab.id
                ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* SEÇÃO 1: Dados Gerais */}
        {activeTab === 'gerais' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-t-lg">
              <Building2 className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-slate-800">Dados Gerais</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social *</label>
                <input
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Fantasia</label>
                <input
                  name="trade_name"
                  value={formData.trade_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ *</label>
                <input
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleMaskCNPJ}
                  placeholder="00.000.000/0000-00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Estadual</label>
                <input
                  name="state_reg"
                  value={formData.state_reg}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Fornecedor Ativo</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO 2: Contatos */}
        {activeTab === 'contatos' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-t-lg">
              <Contact className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-slate-800">Contatos</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsável Principal</label>
                <input
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contato Comercial</label>
                <input
                  name="com_contact"
                  value={formData.com_contact}
                  onChange={handleChange}
                  placeholder="Nome / Fone Comercial"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contato Financeiro</label>
                <input
                  name="fin_contact"
                  value={formData.fin_contact}
                  onChange={handleChange}
                  placeholder="Nome / Fone Financeiro"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO 3: Endereço */}
        {activeTab === 'endereco' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-t-lg">
              <MapPin className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-slate-800">Endereço</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-6 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                <input
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none font-mono"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Logradouro</label>
                <input
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                <input
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                <input
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado (UF)</label>
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  maxLength={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none uppercase"
                />
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO 4: Financeiro */}
        {activeTab === 'financeiro' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-t-lg">
              <DollarSign className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-slate-800">Financeiro</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Banco</label>
                <input
                  name="bank"
                  value={formData.bank}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PIX</label>
                <input
                  name="pix"
                  value={formData.pix}
                  onChange={handleChange}
                  placeholder="Chave PIX"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Agência</label>
                <input
                  name="agency"
                  value={formData.agency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Conta Corrente/Poupança</label>
                <input
                  name="account"
                  value={formData.account}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO 5: Extras */}
        {activeTab === 'extras' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-t-lg">
              <Info className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-slate-800">Extras</h2>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Observações Internas</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Anotações, restrições ou termos de contrato..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 outline-none resize-y"
              />
            </div>
          </div>
        )}

        {/* AÇÕES DE SALVAR */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate('/app/suppliers')}
            className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-transparent hover:bg-slate-100 rounded-md transition-colors mr-3"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loading 
              ? (toast.show && toast.type === 'success' ? 'Redirecionando...' : 'Salvando...') 
              : (isEditing ? 'Salvar Alterações' : 'Cadastrar Fornecedor')}
          </button>
        </div>
      </form>
    </div>
  );
}
