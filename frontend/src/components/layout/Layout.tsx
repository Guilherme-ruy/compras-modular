import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { SubscriptionModal } from '../ui/SubscriptionModal';
import { TrialBanner } from './TrialBanner';
import { ReadOnlyBanner } from './ReadOnlyBanner';
import api from '../../services/api';
import { useState, useEffect } from 'react';

export function Layout({ children }: { children: React.ReactNode }) {
    const { isLoading } = useTheme();
    const location = useLocation();
    const { user } = useAuth();
    const isAdmin = user?.roleName === 'TENANT_ADMIN' || user?.roleName === 'ADMIN' || user?.roleName === 'Administrador';
    
    const [trialRemainingDays, setTrialRemainingDays] = useState<number | null>(null);
    const [showTrialBanner, setShowTrialBanner] = useState<boolean>(true);
    const [status, setStatus] = useState<string>('inactive');

    useEffect(() => {
        const dismissed = localStorage.getItem('hideTrialBanner');
        if (dismissed === 'true') {
            setShowTrialBanner(false);
        }

        api.get('/stripe/status').then((res) => {
            if (res.data.status === 'trialing' && res.data.trialRemainingDays !== undefined) {
                setTrialRemainingDays(res.data.trialRemainingDays);
            }
            setStatus(res.data.status);
        }).catch(err => console.error(err));
    }, []);

    const handleDismissBanner = () => {
        setShowTrialBanner(false);
        localStorage.setItem('hideTrialBanner', 'true');
    };

    const handleShowBanner = () => {
        setShowTrialBanner(true);
        localStorage.setItem('hideTrialBanner', 'false');
    };
    
    const isUpgrade = new URLSearchParams(location.search).get('upgrade') === 'true' 
        || new URLSearchParams(location.search).get('success') 
        || new URLSearchParams(location.search).get('canceled');

    if (isLoading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-slate-50">Carregando tema...</div>;
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden relative">
                {isAdmin && showTrialBanner && trialRemainingDays !== null && status === 'trialing' && (
                    <TrialBanner 
                        remainingDays={trialRemainingDays} 
                        onDismiss={handleDismissBanner} 
                    />
                )}
                <ReadOnlyBanner status={status} />
                <Topbar 
                    trialRemainingDays={isAdmin && !showTrialBanner && status === 'trialing' ? trialRemainingDays : null} 
                    onShowTrialBanner={handleShowBanner}
                />
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
            {isUpgrade && <SubscriptionModal />}
        </div>
    );
}
