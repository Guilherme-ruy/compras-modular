import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { settingsApi } from '../api/settingsApi';
import type { SystemSettings } from '../types';
import { Save, Loader2, Building2 } from 'lucide-react';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';

interface CompanyTabProps {
    initialSettings?: SystemSettings;
}

export default function CompanyTab({ initialSettings }: CompanyTabProps) {
    const { user } = useAuth();

    // Helpers for CNPJ Masking
    const maskCNPJ = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 14);
        return digits
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    };

    const unmask = (value: string) => value.replace(/\D/g, '');

    // Controlled Form State
    const [companyName, setCompanyName] = useState(initialSettings?.company_name || '');
    const [document, setDocument] = useState(maskCNPJ(initialSettings?.document || ''));

    const [isSaving, setIsSaving] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Only SUPERADMIN can see this tab
    if (user?.roleName !== 'SUPERADMIN') {
        return (
            <div className="p-8 text-center text-slate-500">
                Você não tem permissão para alterar as configurações do sistema.
            </div>
        );
    }

    const handleOpenConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        setIsConfirmOpen(true);
    };

    const handleConfirmSave = async () => {
        setIsConfirmOpen(false);
        setIsSaving(true);
        setMessage(null);

        try {
            await settingsApi.updateSystemSettings({
                company_name: companyName,
                document: unmask(document) // Save only numbers
            });

            setMessage({ type: 'success', text: 'Dados da empresa atualizados! (Recarregue a página para ver o novo nome no topo).' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data || 'Erro ao atualizar dados da empresa.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDocument(maskCNPJ(e.target.value));
    };

    return (
        <>
            <form onSubmit={handleOpenConfirm} className="space-y-6 max-w-lg animate-in fade-in duration-300">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Dados da Empresa</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Informações globais do sistema. O nome da empresa aparacerá na barra superior para todos os funcionários.
                    </p>
                </div>

                {message && (
                    <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-brand-600 mb-6 shadow-sm">
                        <Building2 className="w-6 h-6" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                        <input
                            type="text"
                            value={document}
                            onChange={handleDocumentChange}
                            placeholder="00.000.000/0000-00"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors font-mono text-sm"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 transition-colors disabled:opacity-70"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Empresa
                    </button>
                </div>
            </form>

            <ConfirmModal
                isOpen={isConfirmOpen}
                title="Salvar Alterações?"
                message={`Você está prestes a alterar o nome da empresa para "${companyName}" e o CNPJ para "${document}". Isso será refletido para todos os usuários do sistema. Deseja continuar?`}
                onConfirm={handleConfirmSave}
                onCancel={() => setIsConfirmOpen(false)}
                confirmText="Sim, Salvar"
                cancelText="Cancelar"
            />
        </>
    );
}

