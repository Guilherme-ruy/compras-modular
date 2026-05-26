import React, { useState, useEffect } from 'react';
import { CreditCard, CalendarDays, ExternalLink, ShieldCheck } from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function BillingTab() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('inactive');
    const [renewalDate, setRenewalDate] = useState<string | null>(null);
    const { user } = useAuth();
    const isAdmin = ['SUPERADMIN', 'TENANT_ADMIN', 'ADMIN', 'Administrador'].includes(user?.roleName ?? '');

    useEffect(() => {
        api.get('/stripe/status').then((res) => {
            setStatus(res.data.status);
            if (res.data.renewalDate) {
                const date = new Date(res.data.renewalDate);
                setRenewalDate(new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date));
            }
        }).catch(err => console.error('Erro ao carregar status da assinatura:', err));
    }, []);

    const handleManageSubscription = async () => {
        setLoading(true);
        try {
            const response = await api.post('/stripe/portal');
            if (response.data && response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error('Erro ao gerar portal:', error);
            alert('Falha ao abrir portal de gerenciamento. Você já possui uma assinatura ativa?');
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const response = await api.post('/stripe/checkout');
            if (response.data && response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error('Erro ao gerar checkout:', error);
            alert('Falha ao conectar com o serviço de pagamento.');
        } finally {
            setLoading(false);
        }
    };

    const isSubscribed = status === 'active' || status === 'canceled';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-lg font-bold text-slate-800">Assinatura e Faturamento</h2>
                <p className="text-sm text-slate-500 mt-1">Gerencie o plano da sua empresa, métodos de pagamento e histórico de faturas.</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm max-w-2xl">
                <div className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center border border-brand-100">
                                <CreditCard className="h-6 w-6 text-brand-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-800">
                                    Plano {isSubscribed ? 'Premium' : (status === 'trialing' ? 'Teste Grátis' : 'Inativo')}
                                </h3>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {isSubscribed ? 'Acesso total a todos os módulos do sistema.' : 'Sua empresa precisa de uma assinatura para operar.'}
                                </p>
                            </div>
                        </div>
                        {isSubscribed && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Ativa
                            </span>
                        )}
                        {!isSubscribed && status === 'trialing' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Em teste
                            </span>
                        )}
                    </div>

                    {isSubscribed && renewalDate && status !== 'canceled' && (
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center gap-3">
                                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                    <CalendarDays className="h-5 w-5 text-brand-600" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Próxima Renovação</p>
                                    <p className="text-sm font-bold text-slate-700">{renewalDate}</p>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Valor do Plano</p>
                                    <p className="text-sm font-bold text-slate-700">Consulte no portal</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'canceled' && (
                        <div className="mt-6 rounded-xl bg-yellow-50 p-4 border border-yellow-100">
                            <h3 className="text-sm font-semibold text-yellow-800">Assinatura cancelada ou suspensa</h3>
                            <p className="mt-1 text-xs text-yellow-700">Por favor, atualize seus dados de pagamento ou reative a assinatura no portal.</p>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end">
                    {!isAdmin ? (
                        <p className="text-xs text-slate-500 font-medium">Apenas administradores podem gerenciar o faturamento.</p>
                    ) : isSubscribed ? (
                        <button
                            onClick={handleManageSubscription}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {loading ? 'Aguarde...' : 'Gerenciar Faturamento'}
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-600 border border-transparent rounded-lg text-sm font-semibold text-white hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {loading ? 'Aguarde...' : 'Assinar Agora'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
