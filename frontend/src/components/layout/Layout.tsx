import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useTheme } from '../../contexts/ThemeContext';

export function Layout({ children }: { children: ReactNode }) {
    const { isLoading } = useTheme();

    if (isLoading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-slate-50">Carregando tema...</div>;
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
