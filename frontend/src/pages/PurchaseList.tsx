import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Building, Filter, X } from 'lucide-react';
import api from '../services/api';

type Purchase = {
    id: string;
    total_amount: number;
    status: string;
};

export function PurchaseList() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [departments, setDepartments] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        fetchPurchases();
    }, [statusFilter, deptFilter]);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/departments');
            setDepartments(res.data || []);
        } catch (err) {
            console.error('Failed to fetch departments:', err);
        }
    };

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (deptFilter) params.append('dept_id', deptFilter);

            const res = await api.get(`/purchases?${params.toString()}`);
            setPurchases(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const statusColors: Record<string, string> = {
        DRAFT: 'bg-blue-100 text-blue-800',
        PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
        APPROVED: 'bg-emerald-100 text-emerald-800',
        REJECTED: 'bg-red-100 text-red-800',
    };

    const statusLabels: Record<string, string> = {
        DRAFT: 'Rascunho',
        PENDING_APPROVAL: 'Em Revisão',
        APPROVED: 'Aprovado',
        REJECTED: 'Rejeitado',
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Pedidos de Compra</h1>
                    <p className="text-slate-500 text-sm mt-1">Gerencie e acompanhe as requisições de compra</p>
                </div>
                <button
                    onClick={() => navigate('/app/purchases/new')}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Novo Pedido
                </button>
            </div>

            {/* FILTERS BAR - Refined & Premium Design */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                    <div className="space-y-1.5 group">
                        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 group-focus-within:text-brand-600 transition-colors">
                            <Filter className="w-3 h-3" />
                            Status do Pedido
                        </label>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="block w-full rounded-lg border-slate-200 bg-slate-50/50 py-2.5 pl-3 pr-10 text-slate-700 font-medium shadow-sm transition-all focus:border-brand-500 focus:ring-brand-500 focus:bg-white sm:text-sm appearance-none cursor-pointer"
                            >
                                <option value="">Todos os Status</option>
                                <option value="DRAFT">Rascunho</option>
                                <option value="PENDING_APPROVAL">Em Revisão</option>
                                <option value="APPROVED">Aprovado</option>
                                <option value="REJECTED">Rejeitado</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5 group">
                        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 group-focus-within:text-brand-600 transition-colors">
                            <Building className="w-3 h-3" />
                            Departamento
                        </label>
                        <div className="relative">
                            <select
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className="block w-full rounded-lg border-slate-200 bg-slate-50/50 py-2.5 pl-3 pr-10 text-slate-700 font-medium shadow-sm transition-all focus:border-brand-500 focus:ring-brand-500 focus:bg-white sm:text-sm appearance-none cursor-pointer"
                            >
                                <option value="">Todos os Departamentos</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
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
                            onClick={fetchPurchases}
                            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
                        >
                            <Search className="w-4 h-4" />
                            Aplicar Filtros
                        </button>

                        {(statusFilter || deptFilter) && (
                            <button
                                onClick={() => { setStatusFilter(''); setDeptFilter(''); }}
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

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Carregando pedidos...</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                                <th className="py-3 px-6 font-medium">ID do Pedido</th>
                                <th className="py-3 px-6 font-medium">Valor Total</th>
                                <th className="py-3 px-6 font-medium">Status</th>
                                <th className="py-3 px-6 font-medium text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {purchases.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-slate-500">
                                        Nenhum pedido encontrado.
                                    </td>
                                </tr>
                            ) : (
                                purchases.map(purchase => (
                                    <tr key={purchase.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-6 text-sm font-medium text-slate-700">
                                            {purchase.id.split('-')[0].toUpperCase()}
                                        </td>
                                        <td className="py-3 px-6 text-sm text-slate-600">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(purchase.total_amount)}
                                        </td>
                                        <td className="py-3 px-6">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[purchase.status] || 'bg-slate-100 text-slate-800'}`}>
                                                {statusLabels[purchase.status] || purchase.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 text-right">
                                            <button
                                                onClick={() => navigate(`/app/purchases/${purchase.id}`)}
                                                className="text-brand-600 hover:text-brand-800 text-sm font-medium flex items-center justify-end gap-1 w-full"
                                            >
                                                <FileText className="w-4 h-4" />
                                                Ver Detalhes
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
