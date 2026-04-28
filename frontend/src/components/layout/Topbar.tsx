import { useAuth } from '../../contexts/AuthContext';
import { User } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';

export function Topbar() {
    const { user } = useAuth();
    const { companyName } = useTheme();
    const navigate = useNavigate();

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-slate-800">{companyName}</h2>
            </div>

            <div className="flex items-center gap-3">
                {/* Sino de notificações */}
                <NotificationBell />

                {/* Avatar / perfil */}
                <button
                    onClick={() => navigate('/app/settings')}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
                    title="Meu perfil"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                        <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="max-w-[200px] truncate text-sm font-semibold text-slate-800">
                            {user?.name || 'Usuário'}
                        </p>
                        <p className="max-w-[200px] truncate text-xs text-slate-500">
                            {user?.email || 'E-mail indisponível'}
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center">
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 border border-slate-200">
                            {user?.roleName || 'USER'}
                        </span>
                    </div>
                </button>
            </div>
        </header>
    );
}
