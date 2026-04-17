import { useSuspenseQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, DollarSign, ShoppingCart, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { dashboardApi } from '../api/dashboardApi';
import api from '../../../services/api';
import { normalizeListResponse } from '../../../utils/pagination';

const fetchDashboardData = async () => {
  const metrics = await dashboardApi.getMetrics();
  const purchasesResponse = await api.get(
    '/purchases?page=1&perPage=5&status=PENDING_APPROVAL&sortBy=number&sortOrder=desc',
  );
  const pendingPurchases = normalizeListResponse<any>(purchasesResponse.data, 1, 5).items;

  return { metrics, pendingPurchases };
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data } = useSuspenseQuery({
    queryKey: ['dashboard_data'],
    queryFn: fetchDashboardData,
  });

  const { metrics, pendingPurchases } = data;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const metricCards = [
    {
      label: 'Pendentes',
      value: metrics.pending_purchases_count.toString(),
      helper: 'na fila de aprovacao',
      icon: AlertCircle,
      iconClassName: 'bg-brand-100 text-brand-600',
      cardClassName:
        'cursor-pointer border-brand-200 bg-gradient-to-br from-brand-50/70 via-white to-white hover:border-brand-300 hover:shadow-md',
      valueClassName: 'text-[2rem] font-black text-slate-900 sm:text-[2.1rem]',
      onClick: () => navigate('/app/purchases'),
    },
    {
      label: 'Gasto no mes',
      value: formatCurrency(metrics.total_approved_amount),
      helper: 'aprovado no periodo',
      icon: DollarSign,
      iconClassName: 'bg-emerald-50 text-emerald-600',
      cardClassName: 'border-slate-200 bg-white',
      valueClassName: 'text-[1.35rem] font-bold tracking-tight text-slate-900 sm:text-[1.5rem]',
    },
    {
      label: 'Volume no mes',
      value: metrics.purchases_this_month.toString(),
      helper: 'pedidos criados',
      icon: ShoppingCart,
      iconClassName: 'bg-blue-50 text-blue-600',
      cardClassName: 'border-slate-200 bg-white',
      valueClassName: 'text-[2rem] font-black text-slate-900 sm:text-[2.1rem]',
    },
    {
      label: 'Negados no mes',
      value: metrics.rejected_this_month.toString(),
      helper: 'pedidos recusados',
      icon: XCircle,
      iconClassName: 'bg-red-50 text-red-600',
      cardClassName: 'border-slate-200 bg-white',
      valueClassName: 'text-[2rem] font-black text-slate-900 sm:text-[2.1rem]',
    },
  ];

  return (
    <div className="animate-in space-y-8 fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Visao Geral</h1>
        <p className="mt-1 text-sm text-slate-500">Acompanhamento e indicadores do fluxo de compras.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <>
              <div className="flex items-start justify-between gap-2.5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{card.helper}</p>
                </div>
                <span className={`rounded-lg p-2.5 ${card.iconClassName}`}>
                  <Icon className="h-4.5 w-4.5" />
                </span>
              </div>

              <div className="mt-4">
                <p className={`${card.valueClassName} break-words leading-none tabular-nums`}>
                  {card.value}
                </p>
              </div>
            </>
          );

          if (card.onClick) {
            return (
              <button
                key={card.label}
                type="button"
                onClick={card.onClick}
                className={`group flex h-full min-h-[132px] flex-col justify-between rounded-xl border px-4 py-3.5 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/70 ${card.cardClassName}`}
              >
                {content}
              </button>
            );
          }

          return (
            <div
              key={card.label}
              className={`flex h-full min-h-[132px] flex-col justify-between rounded-xl border px-4 py-3.5 text-left shadow-sm ${card.cardClassName}`}
            >
              {content}
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Recentes para Aprovacao</h2>
            <p className="mt-1 text-sm text-slate-500">Pedidos que entraram na fila de aprovacao.</p>
          </div>
          <button
            onClick={() => navigate('/app/purchases')}
            className="flex items-center gap-1 rounded-md bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Ver todos <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {pendingPurchases.length === 0 ? (
          <div className="p-12 text-center italic text-slate-500">
            Nenhum pedido aguardando aprovacao no momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Pedido</th>
                  <th className="px-5 py-3 font-semibold">Fornecedor</th>
                  <th className="px-5 py-3 text-right font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody>
                {pendingPurchases.map((purchase: any) => (
                  <tr
                    key={purchase.id}
                    className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50/70"
                    onClick={() => navigate(`/app/purchases/${purchase.id}`)}
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      #{String(purchase.number || 0).padStart(5, '0')}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {purchase.supplier?.company_name || 'Nao vinculado'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-800">
                      {formatCurrency(purchase.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-bold text-slate-800">Orcamento Gasto por Departamento</h2>

        <div className="h-80 w-full">
          {metrics.spend_by_department.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-50 italic text-slate-400">
              Sem dados de gastos aprovados suficientes para gerar o grafico.
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
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any) => [formatCurrency(value as number), 'Gasto Aprovado']}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
