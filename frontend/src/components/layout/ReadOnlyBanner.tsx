import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface ReadOnlyBannerProps {
  status: string;
}

export const ReadOnlyBanner: React.FC<ReadOnlyBannerProps> = ({ status }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.roleName === 'TENANT_ADMIN' || user?.roleName === 'ADMIN' || user?.roleName === 'Administrador';

  const handleRenew = async () => {
    try {
      setLoading(true);
      const res = await api.post('/stripe/checkout');
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (status === 'active' || status === 'trialing') {
    return null;
  }

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="flex p-2 rounded-lg bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
          </span>
          <p className="font-medium text-red-800 text-sm">
            <span className="md:hidden">Modo Somente Leitura.</span>
            <span className="hidden md:inline">Sua assinatura expirou. O sistema está em modo somente-leitura.</span>
          </p>
        </div>
        {isAdmin && (
          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <button
              onClick={handleRenew}
              disabled={loading}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors w-full sm:w-auto disabled:opacity-70"
            >
              {loading ? (
                <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Redirecionando...</>
              ) : (
                'Renovar Assinatura'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
