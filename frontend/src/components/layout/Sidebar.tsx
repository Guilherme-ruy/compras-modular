import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Settings, Users, Building2, GitMerge, Store } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';

export function Sidebar() {
    const { user } = useAuth();

    const routes = [
        { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/app/purchases', icon: ShoppingCart, label: 'Pedidos' },
        { path: '/app/suppliers', icon: Store, label: 'Fornecedores' },
        ...(user?.roleName === 'SUPERADMIN' ? [
            { path: '/app/workflows', icon: GitMerge, label: 'Fluxos (Regras)' },
            { path: '/app/users', icon: Users, label: 'Usuários Interno' },
            { path: '/app/departments', icon: Building2, label: 'Departamentos' }
        ] : []),
        { path: '/app/settings', icon: Settings, label: 'Configurações' },
    ];

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
            <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-brand-900">
                <h1 className="text-white font-bold text-xl tracking-tight">CM</h1>
            </div>

            <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
                {routes.map((route) => (
                    <NavLink
                        key={route.path}
                        to={route.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            isActive
                                ? "bg-brand-600 text-white"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <route.icon className="w-5 h-5" />
                        {route.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
