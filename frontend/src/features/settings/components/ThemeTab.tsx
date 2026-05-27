import { useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { settingsApi } from '../api/settingsApi';
import api from '../../../services/api';
import { PRESET_COLORS, type ThemeColors } from '../types';
import { CheckCircle2, Upload, ImageOff, Trash2, RefreshCw, ImagePlus } from 'lucide-react';

type Msg = { type: 'success' | 'error'; text: string };

export default function ThemeTab({ initialColors }: { initialColors?: ThemeColors }) {
    const { user } = useAuth();
    const { logoUrl, applyTheme, setLogo } = useTheme();

    const [selectedColorHex, setSelectedColorHex] = useState<string>(
        initialColors ? initialColors[600] : PRESET_COLORS[0].hex,
    );

    // Logo state
    const [previewFile, setPreviewFile]   = useState<File | null>(null);
    const [previewUrl,  setPreviewUrl]    = useState<string | null>(null);
    const [isDragging,  setIsDragging]    = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Async state
    const [saving,   setSaving]   = useState<'theme' | 'logo' | 'remove' | null>(null);
    const [msg,      setMsg]      = useState<Msg | null>(null);

    const isAdmin = ['SUPERADMIN', 'TENANT_ADMIN', 'ADMIN', 'Administrador'].includes(user?.roleName ?? '');
    if (!isAdmin) {
        return (
            <div className="p-8 text-center text-slate-500">
                Você não tem permissão para alterar as configurações do sistema.
            </div>
        );
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    function pickFile(file: File) {
        if (!file.type.startsWith('image/')) {
            setMsg({ type: 'error', text: 'Apenas imagens são aceitas (PNG, JPG, SVG).' });
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            setMsg({ type: 'error', text: 'A imagem deve ter no máximo 3 MB.' });
            return;
        }
        setMsg(null);
        setPreviewFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }

    function clearFileSelection() {
        setPreviewFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    // ── Handlers ───────────────────────────────────────────────────────────

    async function handleSelectTheme(preset: typeof PRESET_COLORS[0]) {
        setSaving('theme');
        setMsg(null);
        try {
            applyTheme(preset.colors);
            setSelectedColorHex(preset.colors[600]);
            await settingsApi.updateSystemSettings({ themeConfig: preset.colors });
            setMsg({ type: 'success', text: 'Tema aplicado com sucesso!' });
        } catch {
            setMsg({ type: 'error', text: 'Erro ao salvar o tema.' });
        } finally {
            setSaving(null);
        }
    }

    async function handleSaveLogo() {
        if (!previewFile) return;
        setSaving('logo');
        setMsg(null);
        try {
            const formData = new FormData();
            formData.append('file', previewFile);
            const { data } = await api.post<{ url: string }>('/uploads', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await settingsApi.updateSystemSettings({ themeConfig: { logoUrl: data.url } as any });
            setLogo(data.url);
            clearFileSelection();
            setMsg({ type: 'success', text: 'Logo atualizada com sucesso!' });
        } catch {
            setMsg({ type: 'error', text: 'Erro ao enviar a logo. Tente novamente.' });
        } finally {
            setSaving(null);
        }
    }

    async function handleRemoveLogo() {
        setSaving('remove');
        setMsg(null);
        try {
            await settingsApi.updateSystemSettings({ themeConfig: { logoUrl: '' } as any });
            setLogo(undefined);
            setMsg({ type: 'success', text: 'Logo removida com sucesso.' });
        } catch {
            setMsg({ type: 'error', text: 'Erro ao remover a logo.' });
        } finally {
            setSaving(null);
        }
    }

    // ── Drag-and-drop ──────────────────────────────────────────────────────

    function onDragOver(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(true);
    }
    function onDragLeave() { setIsDragging(false); }
    function onDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) pickFile(file);
    }

    const busy = saving !== null;

    return (
        <div className="space-y-10 max-w-2xl">

            {/* ── Feedback ───────────────────────────────────────────────── */}
            {msg && (
                <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
                    msg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {msg.text}
                </div>
            )}

            {/* ── Logo ───────────────────────────────────────────────────── */}
            <section>
                <h3 className="text-base font-semibold text-slate-800">Logo da Empresa</h3>
                <p className="mt-1 text-sm text-slate-500">
                    Aparece no topo do menu lateral. PNG, JPG ou SVG • máx. 3 MB.
                </p>

                <div className="mt-5 space-y-4">
                    {/* Current logo */}
                    {logoUrl ? (
                        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                            <div className="flex h-14 w-32 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-2">
                                <img
                                    src={logoUrl}
                                    alt="Logo atual"
                                    className="max-h-full max-w-full object-contain"
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-700">Logo atual</p>
                                <p className="text-xs text-slate-400 mt-0.5">Esta é a imagem exibida no sidebar</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleRemoveLogo}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                            >
                                {saving === 'remove'
                                    ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    : <Trash2 className="h-3.5 w-3.5" />
                                }
                                Remover
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-400">
                            <ImageOff className="h-5 w-5 shrink-0" />
                            Nenhuma logo definida — o nome do sistema é exibido por texto.
                        </div>
                    )}

                    {/* Upload zone */}
                    {previewUrl ? (
                        /* Preview of selected file */
                        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-600">
                                Pré-visualização
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-32 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-2">
                                    <img
                                        src={previewUrl}
                                        alt="Nova logo"
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-700">{previewFile?.name}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {previewFile ? `${(previewFile.size / 1024).toFixed(0)} KB` : ''}
                                    </p>
                                </div>
                                <div className="flex shrink-0 flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSaveLogo}
                                        disabled={busy}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                                    >
                                        {saving === 'logo'
                                            ? <RefreshCw className="h-4 w-4 animate-spin" />
                                            : <Upload className="h-4 w-4" />
                                        }
                                        Salvar logo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearFileSelection}
                                        disabled={busy}
                                        className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Drop zone */
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            disabled={busy}
                            className={`w-full rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors disabled:opacity-50 ${
                                isDragging
                                    ? 'border-brand-400 bg-brand-50'
                                    : 'border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-slate-100'
                            }`}
                        >
                            <ImagePlus className={`mx-auto h-8 w-8 mb-2 ${isDragging ? 'text-brand-500' : 'text-slate-300'}`} />
                            <p className="text-sm font-medium text-slate-600">
                                {isDragging ? 'Solte a imagem aqui' : 'Clique ou arraste uma imagem'}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">PNG, JPG ou SVG • máx. 3 MB</p>
                        </button>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) pickFile(file);
                        }}
                    />
                </div>
            </section>

            {/* ── Cores ──────────────────────────────────────────────────── */}
            <section className="border-t border-slate-100 pt-8">
                <h3 className="text-base font-semibold text-slate-800">Cor do Sistema</h3>
                <p className="mt-1 text-sm text-slate-500">
                    Aplicada globalmente para todos os usuários da empresa.
                    {saving === 'theme' && (
                        <span className="ml-2 inline-flex items-center gap-1 text-brand-600">
                            <RefreshCw className="h-3 w-3 animate-spin" /> Salvando…
                        </span>
                    )}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {PRESET_COLORS.map((preset) => {
                        const isSelected = selectedColorHex === preset.hex;
                        return (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleSelectTheme(preset)}
                                disabled={busy}
                                className={`relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 transition-all hover:shadow-md disabled:opacity-50 ${
                                    isSelected
                                        ? 'border-brand-500 bg-brand-50'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                            >
                                <div
                                    className="h-10 w-10 rounded-full shadow-sm ring-4 ring-white"
                                    style={{ backgroundColor: preset.hex }}
                                />
                                <span className="text-center text-xs font-medium leading-tight text-slate-700">
                                    {preset.name}
                                </span>
                                {isSelected && (
                                    <div className="absolute -right-2 -top-2 rounded-full bg-white shadow">
                                        <CheckCircle2 className="h-5 w-5 text-brand-500" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
