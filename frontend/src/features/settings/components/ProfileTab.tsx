import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { settingsApi } from '../api/settingsApi';
import { Save, Loader2 } from 'lucide-react';

export default function ProfileTab() {
    const { user, updateUser } = useAuth();

    const [name, setName] = useState(user?.name || '');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            await settingsApi.updateProfile({ name });
            updateUser({ name });
            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: string } })?.response?.data;
            setMessage({ type: 'error', text: msg ?? 'Erro ao atualizar perfil.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-lg animate-in fade-in duration-300">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Meu Perfil</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Atualize suas informações pessoais.
                </p>
            </div>

            {message && (
                <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* E-mail — somente leitura */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        E-mail (Login)
                    </label>
                    <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400 mt-1">O e-mail de acesso não pode ser alterado.</p>
                </div>

                {/* Nome */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nome Completo
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                    />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 transition-colors disabled:opacity-70"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar
                    </button>
                </div>
            </form>
        </div>
    );
}
