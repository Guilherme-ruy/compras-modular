import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

export function Topbar() {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-slate-800">Compras Modular</h2>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4" />
                    <span>{user?.roleName || 'User'}</span>
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
