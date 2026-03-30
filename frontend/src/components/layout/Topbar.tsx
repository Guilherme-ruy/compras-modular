import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../services/api';

export function Topbar() {
    const { user, logout } = useAuth();
    const [companyName, setCompanyName] = useState('Compras Modular');

    useEffect(() => {
        api.get('/system-settings')
            .then(res => {
                if (res.data && res.data.company_name) {
                    setCompanyName(res.data.company_name);
                }
            })
            .catch(err => {
                console.error("Failed to load company name", err);
            });
    }, []);

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-slate-800">{companyName}</h2>
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
