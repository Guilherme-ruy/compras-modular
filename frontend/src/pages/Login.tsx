import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShoppingBag, CheckCircle, X, AlertCircle, ArrowRight, ArrowLeft, Mail, Lock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type PageState = 'idle' | 'loading' | 'success';

const TESTIMONIALS = [
    { text: "Nossa eficiência de compras aumentou 300% no primeiro mês.", author: "João S., CFO" },
    { text: "A visibilidade de gastos agora é perfeita e em tempo real.", author: "Maria C., Diretora" }
];

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [pageState, setPageState] = useState<PageState>('idle');
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'error' | 'success' }>({ visible: false, message: '', type: 'error' });

    const { login } = useAuth();
    const { isLoading: themeLoading, companyName: appName } = useTheme();
    const navigate = useNavigate();
    const [activeTestimonial, setActiveTestimonial] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

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
            login(response.data.token, response.data.permissions || {});
            setTimeout(() => navigate('/app/purchases'), 1600);
        } catch {
            setPageState('idle');
            setToast({ 
                visible: true, 
                message: 'E-mail ou senha inválidos. Verifique suas credenciais.',
                type: 'error'
            });
        }
    };

    if (themeLoading) return null;

    const isLoading = pageState === 'loading';
    const isSuccess = pageState === 'success';

    return (
        <>
            {/* Toast */}
            {toast.visible && (
                <div className={`fixed top-5 right-5 z-50 flex items-start gap-3 bg-white border shadow-2xl rounded-2xl px-4 py-3.5 max-w-xs w-full animate-slide-in-right ${toast.type === 'error' ? 'border-red-100 shadow-red-500/10' : 'border-green-100 shadow-green-500/10'}`}>
                    <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${toast.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                        {toast.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{toast.type === 'error' ? 'Atenção' : 'Sucesso'}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>
                    </div>
                    <button onClick={() => setToast(prev => ({ ...prev, visible: false }))} className="text-slate-300 hover:text-slate-500 transition-colors shrink-0">
                        <X size={15} />
                    </button>
                </div>
            )}

            <div className="min-h-screen flex">
                {/* Left Panel — Form */}
                <div className="w-full lg:w-[55%] flex flex-col justify-center bg-white p-6 relative">
                    <div className="absolute top-8 left-8 flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
                        <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center">
                            <ShoppingBag size={16} className="text-white" />
                        </div>
                        <span className="font-bold tracking-tight text-slate-800">{appName}</span>
                    </div>

                    <a href="https://compras.hqa.com.br" className="absolute top-8 right-8 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors">
                        <ArrowLeft size={16} />
                        Voltar para o site
                    </a>

                    <div className="w-full max-w-[440px] mx-auto animate-fade-in-up mt-12">
                        {isSuccess ? (
                            <div className="px-8 py-16 flex flex-col items-center text-center">
                                <div className="animate-scale-in w-24 h-24 rounded-full bg-green-50 ring-4 ring-green-100 flex items-center justify-center mb-6">
                                    <CheckCircle size={48} className="text-green-500" strokeWidth={1.5} />
                                </div>
                                <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Acesso liberado!</h2>
                                <p className="text-slate-500 mt-2 text-lg">
                                    Bem-vindo de volta ao seu espaço.
                                </p>
                                <div className="mt-8 w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-400 rounded-full animate-progress-bar" />
                                </div>
                                <p className="text-xs text-slate-400 mt-4 font-medium uppercase tracking-wider">Acessando sistema...</p>
                            </div>
                        ) : (
                            <div className="pt-4">
                                <div className="mb-8">
                                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                                        Bem-vindo de volta
                                    </h1>
                                    <p className="text-slate-500 text-sm">
                                        Informe suas credenciais para acessar sua área de gestão de compras.
                                    </p>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-5">
                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Seu E-mail</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <Mail size={18} className="text-slate-400" />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                disabled={isLoading}
                                                className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-slate-800 placeholder:text-slate-400 text-sm font-medium"
                                                placeholder="nome@empresa.com"
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block text-sm font-semibold text-slate-700">Sua Senha</label>
                                            <a href="/forgot-password" className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">Esqueceu?</a>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <Lock size={18} className="text-slate-400" />
                                            </div>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                disabled={isLoading}
                                                className="w-full pl-10 pr-11 py-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-slate-800 placeholder:text-slate-400 text-sm font-medium"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                tabIndex={-1}
                                                onClick={() => setShowPassword(v => !v)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="mt-8 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-brand-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xl shadow-slate-900/20 hover:shadow-brand-700/30"
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Entrando...
                                            </>
                                        ) : (
                                            <>
                                                Acessar Minha Conta
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>

                                    <div className="text-center pt-5">
                                        <p className="text-sm text-slate-500 font-medium">
                                            Não possui uma conta?{' '}
                                            <a href="/signup" className="text-brand-600 hover:text-brand-700 font-bold transition-colors">
                                                Crie aqui
                                            </a>
                                        </p>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel — Decorative */}
                <div className="hidden lg:flex lg:w-[45%] bg-brand-900 relative overflow-hidden flex-col justify-center items-center p-14">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-brand-600/30 rounded-full blur-[100px] opacity-60"></div>
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[80px] opacity-50 translate-y-1/3 -translate-x-1/3"></div>
                        <div
                            className="absolute inset-0 opacity-[0.03]"
                            style={{
                                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                                backgroundSize: '24px 24px',
                            }}
                        />
                    </div>

                    <div className="relative z-10 max-w-md w-full">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl p-8 rounded-3xl relative">
                            <div className="absolute -top-5 -left-5 w-10 h-10 bg-white text-brand-900 rounded-full flex items-center justify-center text-xl font-serif font-bold">"</div>
                            
                            <div className="min-h-[100px] flex items-center">
                                {TESTIMONIALS.map((test, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`transition-all duration-700 absolute inset-0 p-8 flex flex-col justify-center ${activeTestimonial === idx ? 'opacity-100 translate-y-0 relative' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                                    >
                                        <p className="text-2xl font-bold text-white leading-tight mb-6">
                                            {test.text}
                                        </p>
                                        <div className="flex items-center gap-3 mt-auto">
                                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold backdrop-blur-sm border border-white/10">
                                                {test.author.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-white/80">{test.author}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 justify-center mt-6">
                                {TESTIMONIALS.map((_, idx) => (
                                    <div key={idx} className={`w-2 h-2 rounded-full transition-all duration-300 ${activeTestimonial === idx ? 'w-6 bg-white' : 'bg-white/30'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
