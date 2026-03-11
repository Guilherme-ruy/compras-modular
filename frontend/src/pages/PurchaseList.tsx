import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import api from '../services/api';

type Purchase = {
    id: string;
    total_amount: number;
    status: string;
};

export function PurchaseList() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const res = await api.get('/purchases');
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

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
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
