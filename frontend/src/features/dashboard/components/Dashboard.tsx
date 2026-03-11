import { useSuspenseQuery } from '@tanstack/react-query';
import { 
    DollarSign, 
    AlertCircle, 
    ShoppingCart, 
    XCircle,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';

import { dashboardApi } from '../api/dashboardApi';
import api from '../../../services/api';

// Extends dashboard API to also fetch recent pending items
const fetchDashboardData = async () => {
    const metrics = await dashboardApi.getMetrics();
    // Fetch last 5 pending approvals
    const purchasesRes = await api.get('/purchases');
    
    // Naively filter for now since backend filtering might require query params we don't know
    const allPurchases = purchasesRes.data || [];
    const pendingPurchases = allPurchases
        .filter((p: any) => p.status === 'PENDING_APPROVAL')
        .slice(0, 5); // Take top 5

    return { metrics, pendingPurchases };
};

export default function Dashboard() {
    const navigate = useNavigate();

    // 1. Suspense-first data fetching
    const { data } = useSuspenseQuery({
        queryKey: ['dashboard_data'],
        queryFn: fetchDashboardData,
    });

    const { metrics, pendingPurchases } = data;

    // Formatting Helpers
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Visão Geral</h1>
                <p className="text-slate-500 text-sm mt-1">Acompanhamento e indicadores do fluxo de compras.</p>
            </div>

            {/* Z-PATTERN TOP: FAST METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Pendentes (Foco Principal do Usuário) */}
                <div 
                    onClick={() => navigate('/app/purchases')}
                    className="bg-white rounded-xl shadow-sm border-2 border-brand-500 p-6 flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-brand-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="p-3 bg-brand-100 text-brand-600 rounded-lg shrink-0">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Aguardando Avaliação</p>
                        <h3 className="text-3xl font-black text-slate-800">
                            {metrics.pending_purchases_count} <span className="text-sm font-medium text-slate-500">pedidos</span>
                        </h3>
                    </div>
                </div>

                {/* 2. Total Approved */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Gasto Total (Mês)</p>
                        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {formatCurrency(metrics.total_approved_amount)}
                        </h3>
                    </div>
                </div>

                {/* 3. Created this month */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                        <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Volume (Mês)</p>
                        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {metrics.purchases_this_month} <span className="text-sm font-medium text-slate-500">abertos</span>
                        </h3>
                    </div>
                </div>

                {/* 4. Rejected */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg shrink-0">
                        <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Negados (Mês)</p>
                        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {metrics.rejected_this_month} <span className="text-sm font-medium text-slate-500">negados</span>
                        </h3>
                    </div>
                </div>

            </div>

            {/* Z-PATTERN MIDDLE: ACTION TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Recentes para Aprovação</h2>
                        <p className="text-sm text-slate-500 mt-1">Pedidos que acabaram de entrar na fila.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/app/purchases')}
                        className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 px-3 py-1.5 rounded-md"
                    >
                        Ver todos <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                
                {pendingPurchases.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 italic">
                        Nenhum pedido aguardando aprovação no momento. Ótimo trabalho! 🎉
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="text-xs uppercase bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Descrição</th>
                                    <th className="px-6 py-3 font-semibold">Data</th>
                                    <th className="px-6 py-3 font-semibold text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingPurchases.map((p: any) => (
                                    <tr 
                                        key={p.id} 
                                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => navigate(`/app/purchases/${p.id}`)}
                                    >
                                        <td className="px-6 py-4 font-medium text-slate-800">{p.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-800 text-right">
                                            {formatCurrency(p.total_amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Z-PATTERN FOOTER: ANALYTICS GRAPH */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Orçamento Gasto por Departamento</h2>
                
                <div className="h-80 w-full">
                    {metrics.spend_by_department.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 italic bg-slate-50 rounded-lg">
                            Sem dados de gastos aprovados suficientes para gerar o gráfico.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.spend_by_department} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis 
                                    dataKey="department_name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b', fontSize: 13 }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b', fontSize: 13 }}
                                    tickFormatter={(value) => `R$ ${value}`}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [formatCurrency(value as number), 'Gasto Aprovado']}
                                />
                                <Bar 
                                    dataKey="amount" 
                                    fill="#10b981" 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={60}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

        </div>
    );
}
