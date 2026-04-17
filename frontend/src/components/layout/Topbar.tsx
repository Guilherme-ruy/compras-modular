import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function Topbar() {
    const { user, logout } = useAuth();
    const { companyName } = useTheme();

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-slate-800">{companyName}</h2>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                        <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="max-w-[220px] truncate text-sm font-semibold text-slate-800">
                            {user?.name || 'Usuario'}
                        </p>
                        <p className="max-w-[220px] truncate text-xs text-slate-500">
                            {user?.email || 'E-mail indisponivel'}
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center">
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 border border-slate-200">
                            {user?.roleName || 'USER'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    title="Sair"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
