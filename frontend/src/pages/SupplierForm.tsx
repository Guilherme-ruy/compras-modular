import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Building2, MapPin, DollarSign, Contact, Info,
  AlertCircle, AlertTriangle, Plus, Trash2, UserPlus, X,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { SupplierStatus, SupplierStatusLabels } from '../constants/suppliers';

// ── Types ──────────────────────────────────────────────────────────────────

type AdditionalContact = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatCNPJ(value: string): string {
  let v = value.replace(/\D/g, '').slice(0, 14);
  v = v.replace(/^(\d{2})(\d)/, '$1.$2');
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
  v = v.replace(/(\d{4})(\d)/, '$1-$2');
  return v;
}

function formatPhone(value: string): string {
  let v = value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 10) {
    v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (v.length > 6) {
    v = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
  } else if (v.length > 2) {
    v = v.replace(/^(\d{2})(\d+)$/, '($1) $2');
  }
  return v;
}

function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(digits[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
  };

  return calc(12) === parseInt(digits[12]) && calc(13) === parseInt(digits[13]);
}

const ROLES_SUGERIDOS = ['Financeiro', 'Comercial', 'Técnico', 'Diretoria', 'Suporte', 'Logística'];

// ── Component ────────────────────────────────────────────────────────────────

export function SupplierForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { user } = useAuth();

  useEffect(() => {
    if (user?.roleName?.toUpperCase() === 'VIEWER') {
      navigate('/app/suppliers', { replace: true });
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('gerais');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    show: false, message: '', type: 'success',
  });

  const [formData, setFormData] = useState({
    companyName: '',
    tradeName: '',
    cnpj: '',
    stateReg: '',
    status: SupplierStatus.ACTIVE,
    contactName: '',
    phone: '',
    email: '',
    comContact: '',
    finContact: '',
    zipCode: '',
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
    createdAt: '',
    updatedAt: '',
    contacts: [] as AdditionalContact[],
  });

  // Additional contact inline form
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', role: '', phone: '', email: '' });

  const TABS = [
    { id: 'gerais', label: 'Dados Gerais', icon: Building2 },
    { id: 'contatos', label: 'Contatos', icon: Contact },
    { id: 'endereco', label: 'Endereço', icon: MapPin },
    { id: 'financeiro', label: 'Dados Bancários', icon: DollarSign },
    { id: 'extras', label: 'Extras', icon: Info },
  ];

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), type === 'success' ? 4000 : 6000);
  };

  useEffect(() => {
    if (isEditing) loadSupplier();
  }, [id]);

  const loadSupplier = async () => {
    try {
      const res = await api.get(`/suppliers/${id}`);
      const data = res.data;
      setFormData({
        ...data,
        cnpj: formatCNPJ(data.cnpj || ''),
        phone: formatPhone(data.phone || ''),
        contacts: Array.isArray(data.contacts) ? data.contacts : [],
      });
    } catch {
      showToast('Erro ao carregar fornecedor.', 'error');
      setTimeout(() => navigate('/app/suppliers'), 2000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCNPJ = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, cnpj: formatCNPJ(e.target.value) }));
  };

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }));
  };

  // ── Additional contacts ──────────────────────────────────────────────────

  const addContact = () => {
    if (!newContact.name.trim()) {
      showToast('O nome do contato é obrigatório.', 'warning');
      return;
    }
    if (newContact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newContact.email)) {
      showToast('E-mail do contato inválido.', 'warning');
      return;
    }
    const contact: AdditionalContact = {
      id: crypto.randomUUID(),
      name: newContact.name.trim(),
      role: newContact.role.trim(),
      phone: formatPhone(newContact.phone),
      email: newContact.email.trim(),
    };
    setFormData(prev => ({ ...prev, contacts: [...prev.contacts, contact] }));
    setNewContact({ name: '', role: '', phone: '', email: '' });
    setShowNewContact(false);
  };

  const removeContact = (contactId: string) => {
    setFormData(prev => ({ ...prev, contacts: prev.contacts.filter(c => c.id !== contactId) }));
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName.trim()) {
      showToast('A Razão Social é obrigatória.', 'warning');
      setActiveTab('gerais');
      return;
    }
    if (!formData.cnpj) {
      showToast('O CNPJ é obrigatório.', 'warning');
      setActiveTab('gerais');
      return;
    }
    if (!validateCNPJ(formData.cnpj)) {
      showToast('CNPJ inválido. Verifique os dígitos informados.', 'warning');
      setActiveTab('gerais');
      return;
    }

    setLoading(true);

    const cleanPayload = {
      companyName: formData.companyName.trim(),
      tradeName: formData.tradeName.trim(),
      cnpj: formData.cnpj.replace(/\D/g, ''),
      stateReg: formData.stateReg.trim(),
      status: formData.status,
      contactName: formData.contactName.trim(),
      phone: formData.phone.replace(/\D/g, ''),
      email: formData.email.trim() || undefined,
      comContact: formData.comContact.trim(),
      finContact: formData.finContact.trim(),
      zipCode: formData.zipCode.trim(),
      street: formData.street.trim(),
      number: formData.number.trim(),
      neighborhood: formData.neighborhood.trim(),
      city: formData.city.trim(),
      state: formData.state.trim().toUpperCase(),
      bank: formData.bank.trim(),
      agency: formData.agency.trim(),
      account: formData.account.trim(),
      pix: formData.pix.trim(),
      notes: formData.notes.trim(),
      contacts: formData.contacts.map(({ id: _id, ...rest }) => rest),
    };

    try {
      if (isEditing) {
        await api.put(`/suppliers/${id}`, cleanPayload);
        showToast('Alterações salvas com sucesso!', 'success');
      } else {
        const res = await api.post('/suppliers', cleanPayload);
        showToast('Fornecedor cadastrado com sucesso!', 'success');
        navigate(`/app/suppliers/${res.data.id}/edit`, { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message;
      showToast(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erro inesperado ao salvar.'), 'error');
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none transition-all text-sm text-slate-800 placeholder:text-slate-300';
  const labelClass = 'block text-sm font-medium text-slate-600 mb-1.5';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white font-medium text-sm ${
          toast.type === 'error' ? 'bg-red-600' : toast.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-600'
        }`}>
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{typeof toast.message === 'string' ? toast.message : JSON.stringify(toast.message)}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/app/suppliers')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-800 truncate">
              {isEditing
                ? (formData.companyName || 'Editar Fornecedor')
                : 'Novo Fornecedor'}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isEditing ? 'Atualize os dados do fornecedor' : 'Preencha os dados para cadastrar'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/app/suppliers')}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Voltar à lista
          </button>
          <button
            type="submit"
            form="supplier-form"
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Cadastrar'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl p-1.5 shadow-sm border border-slate-100 gap-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <form id="supplier-form" onSubmit={handleSubmit} className="space-y-6">

        {/* ── Tab: Dados Gerais ── */}
        {activeTab === 'gerais' && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-600" /> Dados Gerais
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={labelClass}>Razão Social *</label>
                <input name="companyName" value={formData.companyName} onChange={handleChange} className={inputClass} placeholder="Nome jurídico completo" />
              </div>
              <div>
                <label className={labelClass}>Nome Fantasia</label>
                <input name="tradeName" value={formData.tradeName} onChange={handleChange} className={inputClass} placeholder="Nome comercial" />
              </div>
              <div>
                <label className={labelClass}>CNPJ *</label>
                <input
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleCNPJ}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className={`${inputClass} font-mono`}
                />
                {formData.cnpj.replace(/\D/g, '').length === 14 && !validateCNPJ(formData.cnpj) && (
                  <p className="mt-1.5 text-xs text-red-500">CNPJ inválido — verifique os dígitos</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Inscrição Estadual</label>
                <input name="stateReg" value={formData.stateReg} onChange={handleChange} className={inputClass} placeholder="Ex: 123.456.789.000" />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                  {Object.entries(SupplierStatusLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Contatos ── */}
        {activeTab === 'contatos' && (
          <div className="space-y-4">
            {/* Contato principal */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Contact className="w-4 h-4 text-brand-600" /> Contato Principal
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>Nome do Responsável</label>
                  <input name="contactName" value={formData.contactName} onChange={handleChange} className={inputClass} placeholder="Nome completo" />
                </div>
                <div>
                  <label className={labelClass}>Telefone / WhatsApp</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhone}
                    placeholder="(00) 00000-0000"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>E-mail</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="contato@empresa.com" />
                </div>
                <div>
                  <label className={labelClass}>Contato Comercial</label>
                  <input name="comContact" value={formData.comContact} onChange={handleChange} className={inputClass} placeholder="Nome / Telefone comercial" />
                </div>
                <div>
                  <label className={labelClass}>Contato Financeiro</label>
                  <input name="finContact" value={formData.finContact} onChange={handleChange} className={inputClass} placeholder="Nome / Telefone financeiro" />
                </div>
              </div>
            </div>

            {/* Contatos adicionais */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-brand-600" /> Contatos Adicionais
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Adicione múltiplos e-mails e telefones por área
                  </p>
                </div>
                {!showNewContact && (
                  <button
                    type="button"
                    onClick={() => setShowNewContact(true)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                )}
              </div>

              <div className="p-6 space-y-3">
                {/* Lista de contatos salvos */}
                {formData.contacts.length === 0 && !showNewContact && (
                  <p className="text-sm text-slate-400 text-center py-4">
                    Nenhum contato adicional cadastrado.
                  </p>
                )}
                {formData.contacts.map(contact => (
                  <div key={contact.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Nome</p>
                        <p className="text-sm text-slate-800 font-semibold">{contact.name}</p>
                      </div>
                      {contact.role && (
                        <div>
                          <p className="text-xs text-slate-400 font-medium">Área</p>
                          <p className="text-sm text-slate-700">{contact.role}</p>
                        </div>
                      )}
                      {contact.phone && (
                        <div>
                          <p className="text-xs text-slate-400 font-medium">Telefone</p>
                          <p className="text-sm text-slate-700">{contact.phone}</p>
                        </div>
                      )}
                      {contact.email && (
                        <div>
                          <p className="text-xs text-slate-400 font-medium">E-mail</p>
                          <p className="text-sm text-slate-700 truncate">{contact.email}</p>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeContact(contact.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors mt-0.5 shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Formulário inline para novo contato */}
                {showNewContact && (
                  <div className="border border-brand-200 bg-brand-50/50 rounded-xl p-4 space-y-4">
                    <p className="text-sm font-semibold text-slate-700">Novo contato</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Nome *</label>
                        <input
                          value={newContact.name}
                          onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))}
                          className={inputClass}
                          placeholder="Nome completo"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Área / Cargo</label>
                        <input
                          value={newContact.role}
                          onChange={e => setNewContact(p => ({ ...p, role: e.target.value }))}
                          className={inputClass}
                          placeholder="Ex: Financeiro"
                          list="roles-sugeridos"
                        />
                        <datalist id="roles-sugeridos">
                          {ROLES_SUGERIDOS.map(r => <option key={r} value={r} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className={labelClass}>Telefone</label>
                        <input
                          value={newContact.phone}
                          onChange={e => setNewContact(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                          className={inputClass}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>E-mail</label>
                        <input
                          type="email"
                          value={newContact.email}
                          onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))}
                          className={inputClass}
                          placeholder="email@empresa.com"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={addContact}
                        className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Adicionar
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowNewContact(false); setNewContact({ name: '', role: '', phone: '', email: '' }); }}
                        className="flex items-center gap-1.5 px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" /> Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Endereço ── */}
        {activeTab === 'endereco' && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600" /> Endereço
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-6 gap-5">
              <div className="md:col-span-2">
                <label className={labelClass}>CEP</label>
                <input name="zipCode" value={formData.zipCode} onChange={handleChange} className={`${inputClass} font-mono`} placeholder="00000-000" maxLength={9} />
              </div>
              <div className="md:col-span-4">
                <label className={labelClass}>Logradouro</label>
                <input name="street" value={formData.street} onChange={handleChange} className={inputClass} placeholder="Rua, Avenida..." />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Número</label>
                <input name="number" value={formData.number} onChange={handleChange} className={inputClass} placeholder="Ex: 100" />
              </div>
              <div className="md:col-span-4">
                <label className={labelClass}>Bairro</label>
                <input name="neighborhood" value={formData.neighborhood} onChange={handleChange} className={inputClass} />
              </div>
              <div className="md:col-span-4">
                <label className={labelClass}>Cidade</label>
                <input name="city" value={formData.city} onChange={handleChange} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>UF</label>
                <input name="state" value={formData.state} onChange={handleChange} maxLength={2} className={`${inputClass} uppercase`} placeholder="SP" />
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Financeiro ── */}
        {activeTab === 'financeiro' && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand-600" /> Dados Bancários
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Banco</label>
                <input name="bank" value={formData.bank} onChange={handleChange} className={inputClass} placeholder="Ex: Itaú, Nubank..." />
              </div>
              <div>
                <label className={labelClass}>Chave PIX</label>
                <input name="pix" value={formData.pix} onChange={handleChange} className={inputClass} placeholder="CNPJ, e-mail, telefone ou chave aleatória" />
              </div>
              <div>
                <label className={labelClass}>Agência</label>
                <input name="agency" value={formData.agency} onChange={handleChange} className={inputClass} placeholder="0000" />
              </div>
              <div>
                <label className={labelClass}>Conta Corrente / Poupança</label>
                <input name="account" value={formData.account} onChange={handleChange} className={inputClass} placeholder="00000-0" />
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Extras ── */}
        {activeTab === 'extras' && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-brand-600" /> Extras
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className={labelClass}>Observações Internas</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Anotações, restrições, termos de contrato..."
                  className={`${inputClass} resize-y`}
                />
              </div>
              {isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
                  <div>
                    <label className={labelClass}>Cadastrado em</label>
                    <input
                      readOnly
                      value={formData.createdAt ? new Date(formData.createdAt).toLocaleString('pt-BR') : ''}
                      className={`${inputClass} cursor-not-allowed text-slate-400`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Última atualização</label>
                    <input
                      readOnly
                      value={formData.updatedAt ? new Date(formData.updatedAt).toLocaleString('pt-BR') : ''}
                      className={`${inputClass} cursor-not-allowed text-slate-400`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </form>
    </div>
  );
}
