import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Settings, Users, Building2, GitMerge, Store, Layers, LogOut, BarChart2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export function Sidebar() {
    const { user, logout } = useAuth();
    const { logoUrl, companyName } = useTheme();

    const routes = [
        { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/app/purchases', icon: ShoppingCart, label: 'Pedidos' },
        { path: '/app/suppliers', icon: Store, label: 'Fornecedores' },
        ...(['SUPERADMIN', 'TENANT_ADMIN', 'ADMIN', 'Administrador'].includes(user?.roleName ?? '') ? [
            { path: '/app/workflows', icon: GitMerge, label: 'Fluxos (Regras)' },
            { path: '/app/users', icon: Users, label: 'Usuários Interno' },
            { path: '/app/departments', icon: Building2, label: 'Departamentos' },
            { path: '/app/categories', icon: Layers, label: 'Categorias' },
        ] : []),
        { path: '/app/settings', icon: Settings, label: 'Configurações' },
        { path: '/app/reports', icon: BarChart2, label: 'Relatórios' },
    ];

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">

            {/* Logo + nome da empresa — h-16 alinhado com o Topbar */}
            <div className="h-16 shrink-0 flex items-center gap-3 px-5 border-b border-slate-800">
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt="Logo"
                        className="max-h-8 max-w-[140px] object-contain object-left"
                    />
                ) : (
                    <span className="text-base font-extrabold tracking-tight text-white truncate">
                        HQA Compras
                    </span>
                )}
                {companyName && (
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 truncate">
                        {companyName}
                    </span>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
                {routes.map((route) => (
                    <NavLink
                        key={route.path}
                        to={route.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            (isActive && route.path.startsWith('/app'))
                                ? "bg-brand-600 text-white"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <route.icon className="w-5 h-5" />
                        {route.label}
                    </NavLink>
                ))}
            </nav>

            {/* Rodapé — Logout */}
            <div className="px-3 py-4 border-t border-slate-800">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sair
                </button>
            </div>
        </aside>
    );
}
