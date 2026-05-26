import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, CheckCircle, ShoppingBag, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { PasswordStrengthMeter } from '../components/ui/PasswordStrengthMeter';

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export function ResetPassword() {
    const { companyName } = useTheme();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') ?? '';

    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!PASSWORD_RULE.test(newPassword)) {
            setError('A senha não atende aos requisitos: mínimo 8 caracteres, uma maiúscula e um número.');
            return;
        }
        if (newPassword !== confirm) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', { token, newPassword });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg ?? 'Token inválido ou expirado. Solicite um novo link.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-8 py-12 max-w-sm w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-50 ring-4 ring-amber-100 flex items-center justify-center mx-auto mb-5">
                        <AlertTriangle size={28} className="text-amber-500" strokeWidth={1.8} />
                    </div>
                    <h1 className="text-lg font-bold text-slate-800">Link inválido</h1>
                    <p className="text-slate-400 text-sm mt-2">Este link de redefinição é inválido ou expirou.</p>
                    <Link to="/forgot-password" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
                        Solicitar novo link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative">
            <a href="https://compras.hqa.com.br" className="absolute top-8 right-8 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors hidden md:flex">
                <ArrowLeft size={16} />
                Voltar para o site
            </a>
            <div className="w-full max-w-md animate-fade-in-up">
                {/* Brand */}
                <div className="flex items-center gap-2.5 mb-8 justify-center">
                    <div className="w-9 h-9 rounded-xl bg-brand-700 flex items-center justify-center">
                        <ShoppingBag size={17} className="text-white" />
                    </div>
                    <span className="font-bold text-slate-800 text-lg">{companyName}</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {success ? (
                        /* ── Sucesso ── */
                        <div className="px-8 py-12 flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-green-50 ring-4 ring-green-100 flex items-center justify-center mb-5">
                                <CheckCircle size={36} className="text-green-500" strokeWidth={1.8} />
                            </div>
                            <h1 className="text-xl font-bold text-slate-800">Senha redefinida!</h1>
                            <p className="text-slate-500 text-sm mt-2">Redirecionando para o login…</p>
                            <div className="mt-6 w-36 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-400 rounded-full animate-progress-bar" />
                            </div>
                        </div>
                    ) : (
                        /* ── Formulário ── */
                        <div className="px-8 pt-8 pb-8">
                            <div className="mb-7">
                                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                                    Nova senha
                                </h1>
                                <p className="text-slate-400 text-sm mt-1">
                                    Escolha uma senha segura com pelo menos 6 caracteres.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">
                                        Nova senha
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="reset-new-password"
                                            type={showPwd ? 'text' : 'password'}
                                            required
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            disabled={loading}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/25 focus:border-brand-400 outline-none transition-all pr-11 text-slate-800 placeholder:text-slate-300 disabled:opacity-50 text-sm"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => setShowPwd(v => !v)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                        >
                                            {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>
                                    <PasswordStrengthMeter password={newPassword} />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">
                                        Confirmar nova senha
                                    </label>
                                    <input
                                        id="reset-confirm-password"
                                        type={showPwd ? 'text' : 'password'}
                                        required
                                        value={confirm}
                                        onChange={e => setConfirm(e.target.value)}
                                        disabled={loading}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/25 focus:border-brand-400 outline-none transition-all text-slate-800 placeholder:text-slate-300 disabled:opacity-50 text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 active:scale-[0.98] text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm text-sm"
                                >
                                    {loading ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        'Redefinir senha'
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link
                                    to="/login"
                                    className="text-sm text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <ArrowLeft size={14} />
                                    Voltar para o login
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
