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
        { path: '/app/relatorios', icon: BarChart2, label: 'Relatórios' },
        ...(['SUPERADMIN', 'TENANT_ADMIN', 'ADMIN', 'Administrador'].includes(user?.roleName ?? '') ? [
            { path: '/app/workflows', icon: GitMerge, label: 'Fluxos (Regras)' },
            { path: '/app/users', icon: Users, label: 'Usuários Interno' },
            { path: '/app/departments', icon: Building2, label: 'Departamentos' },
            { path: '/app/categories', icon: Layers, label: 'Categorias' },
        ] : []),
        { path: '/app/settings', icon: Settings, label: 'Configurações' },
    ];

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
            {/* Logo e Nome da Empresa */}
            <div className="h-16 flex flex-col justify-center px-6 border-b border-slate-800 bg-slate-900 shrink-0">
                {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="max-h-6 max-w-[160px] object-contain object-left" />
                ) : (
                    <h1 className="text-white font-extrabold text-base tracking-tight truncate leading-tight">HQA Compras</h1>
                )}
                <span className="text-slate-400 text-[11px] font-medium truncate mt-0.5 uppercase tracking-wider">{companyName}</span>
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
