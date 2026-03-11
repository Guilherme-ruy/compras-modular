import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { User, Palette, Building2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { settingsApi } from '../api/settingsApi';
import ProfileTab from './ProfileTab';
import CompanyTab from './CompanyTab';
import ThemeTab from './ThemeTab';

export default function Settings() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'company' | 'theme'>('company');

    // 1. Suspense-first fetching. We fetch SystemSettings early since both CompanyTab and ThemeTab need it.
    // We only fetch it if the user is a SUPERADMIN (as normal users can't edit settings)
    const { data: systemSettings } = useSuspenseQuery({
        queryKey: ['system-settings'],
        queryFn: () => user?.roleName === 'SUPERADMIN' ? settingsApi.getSystemSettings() : Promise.resolve(undefined),
    });

    const tabs = [
        ...(user?.roleName === 'SUPERADMIN' ? [
            { id: 'company', label: 'Empresa', icon: Building2 },
            { id: 'theme', label: 'Aparência', icon: Palette },
        ] : [])
    ] as const;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
                <p className="text-slate-500 text-sm mt-1">Gerencie seu perfil e as preferências globais do sistema.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                
                {/* SETTINGS SIDEBAR */}
                <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 shrink-0">
                    <nav className="flex flex-col gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
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

                {/* SETTINGS CONTENT AREA */}
                <div className="flex-1 p-8 md:p-10">
                    {activeTab === 'company' && user?.roleName === 'SUPERADMIN' && (
                        <CompanyTab initialSettings={systemSettings} />
                    )}
                    {activeTab === 'theme' && user?.roleName === 'SUPERADMIN' && (
                        <ThemeTab initialColors={systemSettings?.theme_config} />
                    )}
                </div>

            </div>
        </div>
    );
}
