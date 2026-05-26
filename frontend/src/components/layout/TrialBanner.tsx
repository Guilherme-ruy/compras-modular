import { useState } from 'react';
import { X, Clock, ArrowRight, Loader2, AlertTriangle, Flame } from 'lucide-react';
import api from '../../services/api';

interface TrialBannerProps {
    remainingDays: number;
    onDismiss: () => void;
}

export function TrialBanner({ remainingDays, onDismiss }: TrialBannerProps) {
    const [loading, setLoading] = useState(false);

    const getBannerConfig = (days: number) => {
        if (days > 15) {
            return {
                bg: 'bg-brand-600',
                icon: Clock,
                title: 'Teste Grátis:',
                message: `Você tem ${days} dias restantes.`,
                buttonText: 'text-brand-700',
                buttonBg: 'bg-white hover:bg-slate-50',
            };
        }
        if (days > 7) {
            return {
                bg: 'bg-blue-600',
                icon: Clock,
                title: 'Aproveite:',
                message: `Faltam ${days} dias para o fim do seu teste grátis.`,
                buttonText: 'text-blue-700',
                buttonBg: 'bg-white hover:bg-slate-50',
            };
        }
        if (days > 3) {
            return {
                bg: 'bg-amber-500',
                icon: AlertTriangle,
                title: 'Atenção:',
                message: `Restam apenas ${days} dias de teste grátis.`,
                buttonText: 'text-amber-700',
                buttonBg: 'bg-white hover:bg-amber-50',
            };
        }
        return {
            bg: 'bg-red-600',
            icon: Flame,
            title: 'Urgente!',
            message: `Seu teste acaba em ${days === 1 ? '1 dia' : `${days} dias`}! Não perca seu acesso.`,
            buttonText: 'text-red-700',
            buttonBg: 'bg-white hover:bg-red-50',
        };
    };

    const config = getBannerConfig(remainingDays);
    const Icon = config.icon;

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
            setLoading(false);
        }
    };

    return (
        <div className={`${config.bg} text-white px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between shadow-md z-40 relative gap-3 sm:gap-0 transition-colors duration-500`}>
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-md shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm font-medium leading-tight">
                    <span className="font-bold mr-1">{config.title}</span> 
                    {config.message}
                </div>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
                <button 
                    onClick={handleSubscribe}
                    disabled={loading}
                    className={`flex items-center gap-1.5 ${config.buttonBg} ${config.buttonText} px-3 py-1.5 rounded-md text-xs font-bold transition-colors shadow-sm disabled:opacity-75 disabled:cursor-not-allowed`}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Aguarde...
                        </>
                    ) : (
                        <>
                            Assinar Agora
                            <ArrowRight className="w-3.5 h-3.5" />
                        </>
                    )}
                </button>
                <button 
                    onClick={onDismiss}
                    className="text-white/70 hover:text-white transition-colors"
                    title="Ocultar aviso"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
