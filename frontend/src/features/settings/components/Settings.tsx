import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Palette, Building2, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { settingsApi } from '../api/settingsApi';
import CompanyTab from './CompanyTab';
import ThemeTab from './ThemeTab';
import ProfileTab from './ProfileTab';

export default function Settings() {
    const { user } = useAuth();
    const isAdmin = user?.roleName === 'SUPERADMIN' || user?.roleName === 'ADMIN';
    const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'theme'>('profile');

    const { data: systemSettings, isLoading } = useQuery({
        queryKey: ['system-settings'],
        queryFn: () => settingsApi.getSystemSettings(),
        enabled: isAdmin,
    });

    const tabs = [
        { id: 'profile', label: 'Meu perfil', icon: User },
        ...(isAdmin
            ? [
                { id: 'company', label: 'Empresa', icon: Building2 },
                { id: 'theme', label: 'Aparencia', icon: Palette },
            ]
            : []),
    ] as const;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Configuracoes</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Gerencie seu perfil e, quando permitido, as preferencias globais do sistema.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 shrink-0">
                    <nav className="flex flex-col gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'profile' | 'company' | 'theme')}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                                    ${activeTab === tab.id
                                        ? 'bg-brand-50 text-brand-700'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }
                                `}
                            >
                                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-brand-600' : 'text-slate-400'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex-1 p-8 md:p-10">
                    {activeTab === 'profile' && <ProfileTab />}
                    {isLoading && isAdmin && (activeTab === 'company' || activeTab === 'theme') && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                            <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                            <p className="text-sm font-medium">Carregando configuraçoes...</p>
                        </div>
                    )}
                    {!isLoading && activeTab === 'company' && isAdmin && systemSettings && (
                        <CompanyTab initialSettings={systemSettings} />
                    )}
                    {!isLoading && activeTab === 'theme' && isAdmin && systemSettings && (
                        <ThemeTab initialColors={systemSettings.themeConfig} />
                    )}
                </div>
            </div>
        </div>
    );
}
