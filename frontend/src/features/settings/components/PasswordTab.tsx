import { useState } from 'react';
import { Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react';
import api from '../../../services/api';
import { PasswordStrengthMeter } from '../../../components/ui/PasswordStrengthMeter';

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function PasswordTab() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const isPasswordValid = PASSWORD_RULE.test(newPassword);
    const passwordsMatch = newPassword === confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!isPasswordValid) {
            setMessage({ type: 'error', text: 'A senha não atende aos requisitos mínimos.' });
            return;
        }
        if (!passwordsMatch) {
            setMessage({ type: 'error', text: 'A nova senha e a confirmação não coincidem.' });
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', { currentPassword, newPassword });
            setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setMessage({ type: 'error', text: msg ?? 'Não foi possível alterar a senha. Verifique sua senha atual.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-lg animate-in fade-in duration-300">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Alterar Senha</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Escolha uma senha com pelo menos 8 caracteres, uma maiúscula e um número.
                </p>
            </div>

            {message && (
                <div className={`flex items-start gap-3 p-4 rounded-xl text-sm border ${
                    message.type === 'success'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : 'bg-red-50 border-red-100 text-red-600'
                }`}>
                    {message.type === 'success' && <CheckCircle size={16} className="shrink-0 mt-0.5" />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Senha atual */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Senha atual
                    </label>
                    <div className="relative">
                        <input
                            id="settings-current-password"
                            type={showCurrent ? 'text' : 'password'}
                            required
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors pr-10 disabled:opacity-50"
                            placeholder="••••••••"
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowCurrent(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                {/* Nova senha */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nova senha
                    </label>
                    <div className="relative">
                        <input
                            id="settings-new-password"
                            type={showNew ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors pr-10 disabled:opacity-50"
                            placeholder="••••••••"
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowNew(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    <PasswordStrengthMeter password={newPassword} />
                </div>

                {/* Confirmar */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Confirmar nova senha
                    </label>
                    <input
                        id="settings-confirm-password"
                        type={showNew ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors disabled:opacity-50 ${
                            confirmPassword && !passwordsMatch
                                ? 'border-red-300 bg-red-50'
                                : 'border-slate-300'
                        }`}
                        placeholder="••••••••"
                    />
                    {confirmPassword && !passwordsMatch && (
                        <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || !isPasswordValid || !passwordsMatch || !currentPassword}
                        className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading
                            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <KeyRound size={15} />
                        }
                        {loading ? 'Salvando...' : 'Alterar senha'}
                    </button>
                </div>
            </form>
        </div>
    );
}
