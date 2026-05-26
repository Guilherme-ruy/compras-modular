import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle2, AlertCircle, X, CalendarDays } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import confetti from 'canvas-confetti';

export const SubscriptionModal: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    
    const queryParams = new URLSearchParams(location.search);
    const success = queryParams.get('success');
    const canceled = queryParams.get('canceled');
    const { user } = useAuth();
    const isAdmin = user?.roleName === 'TENANT_ADMIN' || user?.roleName === 'ADMIN' || user?.roleName === 'Administrador';

    const [status, setStatus] = useState<string>('inactive');
    const [renewalDate, setRenewalDate] = useState<string | null>(null);

    useEffect(() => {
        api.get('/stripe/status').then((res) => {
            setStatus(res.data.status);
            if (res.data.renewalDate) {
                const date = new Date(res.data.renewalDate);
                setRenewalDate(new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date));
            }
        }).catch(err => console.error(err));

        if (success) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function() {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
            }, 250);
        }
    }, [success]);

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

    const closeModal = () => {
        queryParams.delete('upgrade');
        queryParams.delete('success');
        queryParams.delete('canceled');
        const newSearch = queryParams.toString();
        navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
    };

    const isSubscribed = status === 'active' || status === 'canceled';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden relative">
                
                {/* Close Button if they are active/trialing and just checking. If blocked (inactive), they shouldn't close it, but let's allow close, the interceptor will just block them again on next action if they are inactive */}
                <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8">
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-brand-100 mb-4">
                            <CreditCard className="h-8 w-8 text-brand-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Plano e Assinatura
                        </h2>
                        <p className="mt-2 text-slate-600 text-sm px-4">
                            {status === 'trialing' 
                                ? 'Você está no período de testes gratuitos. Assine agora para não perder o acesso.' 
                                : (isSubscribed ? 'Gerencie o plano da sua empresa.' : 'Sua assinatura é necessária para continuar.')}
                        </p>
                    </div>

                    {success && (
                        <div className="rounded-xl bg-green-50 p-5 mb-6 border border-green-200 shadow-sm transition-all transform hover:scale-[1.02]">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-base font-bold text-green-900">Assinatura ativada com sucesso!</h3>
                                    <p className="mt-1 text-sm text-green-700">Seu sistema já está operando com todos os recursos premium desbloqueados.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {isSubscribed && renewalDate && !canceled && (
                        <div className="rounded-xl bg-slate-50 p-4 mb-6 border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                    <CalendarDays className="h-5 w-5 text-brand-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Próxima Renovação</p>
                                    <p className="text-sm font-bold text-slate-800">{renewalDate}</p>
                                </div>
                            </div>
                            <div className="text-xs font-bold px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
                                Ativo
                            </div>
                        </div>
                    )}

                    {canceled && (
                        <div className="rounded-xl bg-yellow-50 p-4 mb-6 border border-yellow-100">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-semibold text-yellow-800">Assinatura cancelada</h3>
                                    <p className="mt-1 text-sm text-yellow-700">O processo de pagamento foi interrompido.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 mt-6">
                        {!isSubscribed && isAdmin && (
                            <button
                                onClick={handleSubscribe}
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-all"
                            >
                                {loading ? 'Processando...' : 'Assinar Agora'}
                            </button>
                        )}
                        
                        {!isSubscribed && !isAdmin && (
                            <div className="w-full py-3 px-4 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium text-center">
                                Apenas administradores podem gerenciar assinaturas.
                            </div>
                        )}
                        
                        {isSubscribed && isAdmin && (
                            <button
                                onClick={handleManageSubscription}
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-slate-300 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-all"
                            >
                                Gerenciar Assinatura
                            </button>
                        )}

                        {success && (
                            <button
                                onClick={closeModal}
                                className="w-full flex justify-center py-2 px-4 text-sm font-medium text-brand-600 hover:text-brand-500"
                            >
                                Voltar para o Sistema
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
