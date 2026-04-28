import { useState } from 'react';
import { Eye, EyeOff, User, Mail, Shield, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type AlertState = { type: 'success' | 'error'; message: string } | null;

export function Profile() {
    const { user } = useAuth();

    // Change password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<AlertState>(null);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setAlert(null);

        if (newPassword !== confirmPassword) {
            setAlert({ type: 'error', message: 'A nova senha e a confirmação não coincidem.' });
            return;
        }
        if (newPassword.length < 6) {
            setAlert({ type: 'error', message: 'A nova senha deve ter pelo menos 6 caracteres.' });
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', { currentPassword, newPassword });
            setAlert({ type: 'success', message: 'Senha alterada com sucesso!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setAlert({ type: 'error', message: msg ?? 'Não foi possível alterar a senha.' });
        } finally {
            setLoading(false);
        }
    };

    const roleLabel: Record<string, string> = {
        SUPERADMIN: 'Super Administrador',
        ADMIN: 'Administrador',
        APROVADOR: 'Aprovador',
        COMPRADOR: 'Comprador',
        REQUISITANTE: 'Requisitante',
        VIEWER: 'Visualizador',
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Meu Perfil</h1>
                <p className="text-slate-400 text-sm mt-1">Visualize seus dados e gerencie sua senha.</p>
            </div>

            {/* ── Informações do usuário ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                    <h2 className="text-base font-semibold text-slate-700">Informações da conta</h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {/* Avatar placeholder + nome */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                            <User size={24} className="text-brand-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 text-lg">{user?.name}</p>
                            <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-100">
                                <Shield size={11} />
                                {roleLabel[user?.roleName ?? ''] ?? user?.roleName}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 pt-2">
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <Mail size={15} className="text-slate-400 shrink-0" />
                            <span>{user?.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Alterar senha ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                    <h2 className="text-base font-semibold text-slate-700">Alterar senha</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Escolha uma senha segura com pelo menos 6 caracteres.</p>
                </div>
                <div className="px-6 py-5">
                    {alert && (
                        <div className={`mb-4 flex items-start gap-3 px-4 py-3 rounded-xl text-sm border ${
                            alert.type === 'success'
                                ? 'bg-green-50 border-green-100 text-green-700'
                                : 'bg-red-50 border-red-100 text-red-600'
                        }`}>
                            {alert.type === 'success' && <CheckCircle size={16} className="shrink-0 mt-0.5" />}
                            {alert.message}
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        {/* Senha atual */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">
                                Senha atual
                            </label>
                            <div className="relative">
                                <input
                                    id="profile-current-password"
                                    type={showCurrent ? 'text' : 'password'}
                                    required
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    disabled={loading}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/25 focus:border-brand-400 outline-none transition-all pr-11 text-slate-800 placeholder:text-slate-300 disabled:opacity-50 text-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowCurrent(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                >
                                    {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        {/* Nova senha */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">
                                Nova senha
                            </label>
                            <div className="relative">
                                <input
                                    id="profile-new-password"
                                    type={showNew ? 'text' : 'password'}
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
                                    onClick={() => setShowNew(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                >
                                    {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirmar */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">
                                Confirmar nova senha
                            </label>
                            <input
                                id="profile-confirm-password"
                                type={showNew ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                disabled={loading}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/25 focus:border-brand-400 outline-none transition-all text-slate-800 placeholder:text-slate-300 disabled:opacity-50 text-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="pt-1">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 active:scale-[0.98] text-white font-semibold px-6 py-2.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm text-sm"
                            >
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    'Alterar senha'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
