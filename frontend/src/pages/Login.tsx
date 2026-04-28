import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShoppingBag, CheckCircle, X, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type PageState = 'idle' | 'loading' | 'success';

const FEATURES = [
    'Fluxos de aprovação configuráveis por departamento',
    'Controle de acesso por perfil e hierarquia',
    'Histórico completo de pedidos e fornecedores',
];

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [pageState, setPageState] = useState<PageState>('idle');
    const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

    const { login } = useAuth();
    const { isLoading: themeLoading, companyName } = useTheme();
    const navigate = useNavigate();

    useEffect(() => {
        if (!toast.visible) return;
        const t = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000);
        return () => clearTimeout(t);
    }, [toast.visible]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setPageState('loading');
        setToast(prev => ({ ...prev, visible: false }));

        try {
            const response = await api.post('/auth/login', { email, password });
            setPageState('success');
            login(response.data.token, response.data.permissions);
            setTimeout(() => navigate('/app/purchases'), 1600);
        } catch {
            setPageState('idle');
            setToast({ visible: true, message: 'E-mail ou senha inválidos. Verifique suas credenciais e tente novamente.' });
        }
    };

    if (themeLoading) return null;

    const isLoading = pageState === 'loading';
    const isSuccess = pageState === 'success';

    return (
        <>
            {/* Toast — fixed, never moves the form */}
            {toast.visible && (
                <div className="fixed top-5 right-5 z-50 flex items-start gap-3 bg-white border border-red-100 shadow-2xl shadow-red-500/10 rounded-2xl px-4 py-3.5 max-w-xs w-full animate-slide-in-right">
                    <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
                        <AlertCircle size={14} className="text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">Acesso negado</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>
                    </div>
                    <button
                        onClick={() => setToast(prev => ({ ...prev, visible: false }))}
                        className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"
                    >
                        <X size={15} />
                    </button>
                </div>
            )}

            <div className="min-h-screen flex">
                {/* Left Panel — decorative */}
                <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 relative overflow-hidden flex-col justify-between p-14">
                    {/* Background geometry */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-white/5" />
                        <div className="absolute top-1/2 -right-28 w-80 h-80 rounded-full bg-white/5" />
                        <div className="absolute -bottom-20 left-1/3 w-56 h-56 rounded-full bg-white/5" />
                        <div className="absolute bottom-1/3 right-1/3 w-32 h-32 rounded-full bg-white/10" />
                        {/* Subtle grid */}
                        <div
                            className="absolute inset-0 opacity-[0.04]"
                            style={{
                                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                                backgroundSize: '32px 32px',
                            }}
                        />
                    </div>

                    {/* Top — brand */}
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                            <ShoppingBag size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">{companyName}</span>
                    </div>

                    {/* Middle — headline */}
                    <div className="relative z-10">
                        <span className="inline-block text-xs font-semibold tracking-widest text-white/40 uppercase mb-5">
                            Gestão de Compras
                        </span>
                        <h2 className="text-4xl font-bold text-white leading-[1.2] mb-5">
                            Controle total<br />sobre seus pedidos
                        </h2>
                        <p className="text-white/55 text-base leading-relaxed max-w-sm">
                            Do pedido à entrega — gerencie fornecedores, aprovações e histórico em uma plataforma integrada.
                        </p>

                        <div className="mt-10 space-y-3.5">
                            {FEATURES.map((f, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-white/15 ring-1 ring-white/25 flex items-center justify-center shrink-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                                    </div>
                                    <span className="text-sm text-white/70">{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom — footer */}
                    <div className="relative z-10">
                        <p className="text-xs text-white/30">
                            © {new Date().getFullYear()} {companyName}
                        </p>
                    </div>
                </div>

                {/* Right Panel — form */}
                <div className="w-full lg:w-[48%] flex items-center justify-center bg-slate-50 p-6">
                    <div className="w-full max-w-md animate-fade-in-up">
                        {/* Mobile brand */}
                        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
                            <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center">
                                <ShoppingBag size={15} className="text-white" />
                            </div>
                            <span className="font-bold text-slate-800">{companyName}</span>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/60 overflow-hidden">
                            {isSuccess ? (
                                /* ── Success state ── */
                                <div className="px-8 py-12 flex flex-col items-center text-center animate-fade-in-up">
                                    <div className="animate-scale-in w-20 h-20 rounded-full bg-green-50 ring-4 ring-green-100 flex items-center justify-center mb-5">
                                        <CheckCircle size={36} className="text-green-500" strokeWidth={1.8} />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800">Acesso liberado!</h2>
                                    <p className="text-slate-400 text-sm mt-1.5">
                                        Redirecionando para o sistema…
                                    </p>
                                    <div className="mt-6 w-36 h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-400 rounded-full animate-progress-bar" />
                                    </div>
                                </div>
                            ) : (
                                /* ── Form state ── */
                                <div className="px-8 pt-8 pb-8">
                                    <div className="mb-7">
                                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                                            Bem-vindo de volta
                                        </h1>
                                        <p className="text-slate-400 text-sm mt-1">
                                            Informe suas credenciais para continuar
                                        </p>
                                    </div>

                                    <form onSubmit={handleLogin} className="space-y-4">
                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1.5">
                                                E-mail
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                disabled={isLoading}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/25 focus:border-brand-400 outline-none transition-all text-slate-800 placeholder:text-slate-300 disabled:opacity-50 text-sm"
                                                placeholder="seu@email.com"
                                            />
                                        </div>

                                        {/* Password */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1.5">
                                                Senha
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    required
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    disabled={isLoading}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/25 focus:border-brand-400 outline-none transition-all pr-11 text-slate-800 placeholder:text-slate-300 disabled:opacity-50 text-sm"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    tabIndex={-1}
                                                    onClick={() => setShowPassword(v => !v)}
                                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Submit */}
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="mt-2 w-full flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 active:scale-[0.98] text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Verificando...
                                                </>
                                            ) : (
                                                <>
                                                    Entrar
                                                    <ArrowRight size={16} />
                                                </>
                                            )}
                                        </button>

                                        <div className="text-center pt-1">
                                            <a
                                                href="/forgot-password"
                                                className="text-xs text-slate-400 hover:text-brand-600 transition-colors"
                                            >
                                                Esqueci minha senha
                                            </a>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        <p className="text-center text-xs text-slate-300 mt-6">
                            © {new Date().getFullYear()} {companyName}. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
