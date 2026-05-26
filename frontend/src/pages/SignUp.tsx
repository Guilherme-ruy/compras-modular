import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShoppingBag, CheckCircle, X, AlertCircle, ArrowRight, ArrowLeft, Building, Mail, Phone, Lock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type PageState = 'idle' | 'loading' | 'success';

const TESTIMONIALS = [
    { text: "Nossa eficiência de compras aumentou 300% no primeiro mês.", author: "João S., CFO" },
    { text: "A visibilidade de gastos agora é perfeita e em tempo real.", author: "Maria C., Diretora" }
];

export function Signup() {
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
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

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setPageState('loading');
        setToast(prev => ({ ...prev, visible: false }));

        try {
            const response = await api.post('/auth/register', { companyName, email, phone, password });
            setPageState('success');
            login(response.data.token, response.data.permissions || {});
            // Redirect to the app, which will block them with 402 and push them to /subscription
            setTimeout(() => navigate('/app/purchases'), 2000);
        } catch (error: any) {
            setPageState('idle');
            setToast({ 
                visible: true, 
                message: error.response?.data?.message || 'Erro ao criar conta. Tente novamente.',
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
                                <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Conta criada!</h2>
                                <p className="text-slate-500 mt-2 text-lg">
                                    Sua jornada de eficiência começa agora.
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
                                        Comece a usar grátis
                                    </h1>
                                    <p className="text-slate-500 text-sm">
                                        Crie seu espaço de trabalho e otimize as compras da sua empresa em minutos.
                                    </p>
                                </div>

                                <form onSubmit={handleSignup} className="space-y-4">
                                    {/* Company Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome da Empresa</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <Building size={18} className="text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={companyName}
                                                onChange={e => setCompanyName(e.target.value)}
                                                disabled={isLoading}
                                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-slate-800 placeholder:text-slate-400 text-sm font-medium"
                                                placeholder="Sua Empresa Ltda"
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-mail do Administrador</label>
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
                                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-slate-800 placeholder:text-slate-400 text-sm font-medium"
                                                placeholder="admin@suaempresa.com"
                                            />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Celular (WhatsApp)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <Phone size={18} className="text-slate-400" />
                                            </div>
                                            <input
                                                type="tel"
                                                required
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                disabled={isLoading}
                                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-slate-800 placeholder:text-slate-400 text-sm font-medium"
                                                placeholder="(11) 99999-9999"
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Senha de Acesso</label>
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
                                                className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-slate-800 placeholder:text-slate-400 text-sm font-medium"
                                                placeholder="Mínimo de 6 caracteres"
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
                                        className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-brand-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xl shadow-slate-900/20 hover:shadow-brand-700/30"
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Criando conta...
                                            </>
                                        ) : (
                                            <>
                                                Criar Minha Conta Grátis
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>

                                    <div className="text-center pt-5">
                                        <p className="text-sm text-slate-500 font-medium">
                                            Já possui uma conta?{' '}
                                            <a href="/login" className="text-brand-600 hover:text-brand-700 font-bold transition-colors">
                                                Fazer Login
                                            </a>
                                        </p>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel — Decorative */}
                <div className="hidden lg:flex lg:w-[45%] bg-slate-50 relative overflow-hidden flex-col justify-center items-center p-14 border-l border-slate-200">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-100 rounded-full blur-[120px] opacity-40 translate-x-1/3 -translate-y-1/3"></div>
                        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100 rounded-full blur-[100px] opacity-40 -translate-x-1/3 translate-y-1/3"></div>
                    </div>

                    <div className="relative z-10 max-w-md w-full">
                        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-slate-200/50 p-8 rounded-3xl relative">
                            <div className="absolute -top-5 -left-5 w-10 h-10 bg-brand-500 text-white rounded-full flex items-center justify-center text-xl font-serif">"</div>
                            
                            <div className="min-h-[100px] flex items-center">
                                {TESTIMONIALS.map((test, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`transition-all duration-700 absolute inset-0 p-8 flex flex-col justify-center ${activeTestimonial === idx ? 'opacity-100 translate-y-0 relative' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                                    >
                                        <p className="text-2xl font-bold text-slate-800 leading-tight mb-6">
                                            {test.text}
                                        </p>
                                        <div className="flex items-center gap-3 mt-auto">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                                {test.author.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-slate-600">{test.author}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 justify-center mt-6">
                                {TESTIMONIALS.map((_, idx) => (
                                    <div key={idx} className={`w-2 h-2 rounded-full transition-all duration-300 ${activeTestimonial === idx ? 'w-6 bg-brand-500' : 'bg-slate-300'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
