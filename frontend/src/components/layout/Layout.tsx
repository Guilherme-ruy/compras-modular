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

        // Detect if the user just returned from a successful Stripe checkout.
        // The Stripe webhook is async — the DB may still show 'trialing' for a few seconds.
        const params = new URLSearchParams(location.search);
        const isSuccess = params.get('success') === 'true';

        api.get('/stripe/status').then((res) => {
            const currentStatus = res.data.status;

            // Webhook not yet processed: treat as active so the banner doesn't flash
            if (isSuccess && currentStatus === 'trialing') {
                setStatus('active');
                setTrialRemainingDays(null);
                return;
            }

            setStatus(currentStatus);
            if (currentStatus === 'trialing' && res.data.trialRemainingDays !== undefined) {
                setTrialRemainingDays(res.data.trialRemainingDays);
            } else {
                setTrialRemainingDays(null);
            }
        }).catch(err => console.error(err));
    }, [location.search]);

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
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 font-sans">
            {/* Banners de largura total — ficam acima do sidebar e topbar */}
            {isAdmin && showTrialBanner && trialRemainingDays !== null && status === 'trialing' && (
                <TrialBanner
                    remainingDays={trialRemainingDays}
                    onDismiss={handleDismissBanner}
                />
            )}
            <ReadOnlyBanner status={status} />

            {/* Corpo principal: sidebar + área de conteúdo sempre alinhados */}
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
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
            </div>

            {isUpgrade && <SubscriptionModal />}
        </div>
    );
}
