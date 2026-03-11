import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { settingsApi } from '../api/settingsApi';
import { Save, Loader2 } from 'lucide-react';

export default function ProfileTab() {
    const { user } = useAuth();
    
    // Controlled Form State
    const [name, setName] = useState(user?.name || '');
    const [password, setPassword] = useState('');
    
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            await settingsApi.updateProfile({ 
                name,
                password: password || undefined // Only send if user typed a new password
            });
            
            // To update the name in the header, we'd ideally get a fresh token or 
            // update the local AuthContext state. For now, we simulate a successful local save.
            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            setPassword(''); // clear password field
            
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data || 'Erro ao atualizar perfil.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg animate-in fade-in duration-300">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Meu Perfil</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Atualize suas informações pessoais e credenciais de acesso.
                </p>
            </div>

            {message && (
                <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail (Login)</label>
                    <input 
                        type="email" 
                        value={user?.email || ''} 
                        disabled
                        className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400 mt-1">O e-mail de acesso não pode ser alterado por aqui.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Deixe em branco para não alterar"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
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
                    Salvar Perfil
                </button>
            </div>
        </form>
    );
}
