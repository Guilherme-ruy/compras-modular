import { useAuth } from '../../contexts/AuthContext';
import { User } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';

import { Clock, CreditCard } from 'lucide-react';

interface TopbarProps {
    trialRemainingDays?: number | null;
    onShowTrialBanner?: () => void;
}

export function Topbar({ trialRemainingDays, onShowTrialBanner }: TopbarProps) {
    const { user } = useAuth();
    const { companyName } = useTheme();
    const navigate = useNavigate();
    const isAdmin = ['SUPERADMIN', 'TENANT_ADMIN', 'ADMIN', 'Administrador'].includes(user?.roleName ?? '');

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
                {trialRemainingDays !== undefined && trialRemainingDays !== null && (
                    <button 
                        onClick={onShowTrialBanner}
                        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition-colors"
                        title="Ver status da assinatura"
                    >
                        <Clock className="w-3.5 h-3.5" />
                        Teste: {trialRemainingDays} {trialRemainingDays === 1 ? 'dia' : 'dias'}
                    </button>
                )}
            </div>

            <div className="flex items-center gap-5">
                {isAdmin && (
                    <div className="relative group flex items-center">
                        <button
                            onClick={() => navigate('?upgrade=true')}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                        >
                            <CreditCard className="w-5 h-5" />
                        </button>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-800 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-md whitespace-nowrap z-50">
                            Faturamento
                        </div>
                    </div>
                )}

                {/* Sino de notificações */}
                <NotificationBell />

                {/* Avatar / perfil */}
                <button
                    onClick={() => navigate('/app/settings')}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
                    title="Meu perfil"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm">
                        <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 pr-2 text-left flex flex-col justify-center">
                        <div className="flex items-baseline gap-1.5 mb-0.5">
                            <p className="truncate text-sm font-bold text-slate-800 leading-none">
                                {user?.name || 'Usuário'}
                            </p>
                            <span className="text-[11px] font-medium text-slate-500 leading-none">
                                • {user?.roleName === 'TENANT_ADMIN' ? 'Administrador' : (user?.roleName === 'ADMIN' ? 'Administrador' : user?.roleName)}
                            </span>
                        </div>
                        <p className="truncate text-xs text-slate-400 leading-none">
                            {user?.email}
                        </p>
                    </div>
                </button>
            </div>
        </header>
    );
}
