import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, ShoppingBag } from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export function ForgotPassword() {
    const { companyName } = useTheme();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch {
            setError('Ocorreu um erro. Tente novamente em instantes.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="w-full max-w-md animate-fade-in-up">
                {/* Brand */}
                <div className="flex items-center gap-2.5 mb-8 justify-center">
                    <div className="w-9 h-9 rounded-xl bg-brand-700 flex items-center justify-center">
                        <ShoppingBag size={17} className="text-white" />
                    </div>
                    <span className="font-bold text-slate-800 text-lg">{companyName}</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {sent ? (
                        /* ── Enviado ── */
                        <div className="px-8 py-12 flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-green-50 ring-4 ring-green-100 flex items-center justify-center mb-5">
                                <CheckCircle size={36} className="text-green-500" strokeWidth={1.8} />
                            </div>
                            <h1 className="text-xl font-bold text-slate-800">Verifique seu e-mail</h1>
                            <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-xs">
                                Se <strong>{email}</strong> estiver cadastrado, você receberá as instruções para redefinir sua senha.
                            </p>
                            <p className="text-xs text-slate-400 mt-4">
                                Não recebeu? Verifique a caixa de spam ou tente novamente.
                            </p>
                            <Link
                                to="/login"
                                className="mt-8 text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1.5 transition-colors"
                            >
                                <ArrowLeft size={14} />
                                Voltar para o login
                            </Link>
                        </div>
                    ) : (
                        /* ── Formulário ── */
                        <div className="px-8 pt-8 pb-8">
                            <div className="mb-7">
                                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                                    Esqueci minha senha
                                </h1>
                                <p className="text-slate-400 text-sm mt-1">
                                    Informe seu e-mail e enviaremos o link de redefinição.
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
                                        E-mail
                                    </label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input
                                            id="forgot-email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            disabled={loading}
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/25 focus:border-brand-400 outline-none transition-all text-slate-800 placeholder:text-slate-300 disabled:opacity-50 text-sm"
                                            placeholder="seu@email.com"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 active:scale-[0.98] text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm text-sm"
                                >
                                    {loading ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        'Enviar link de redefinição'
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
