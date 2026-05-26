import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { settingsApi } from '../api/settingsApi';
import api from '../../../services/api';
import { PRESET_COLORS, type ThemeColors } from '../types';
import { CheckCircle2, Upload } from 'lucide-react';

export default function ThemeTab({ initialColors }: { initialColors?: ThemeColors }) {
    const { user } = useAuth();
    const { applyTheme } = useTheme();
    
    // Find matching preset by checking if the primary 600 color exists
    const [selectedColorHex, setSelectedColorHex] = useState<string>(
        initialColors ? initialColors[600] : PRESET_COLORS[0].hex
    );
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    // Only SUPERADMIN/ADMIN can see this tab (safeguard)
    const isAdmin = ['SUPERADMIN', 'TENANT_ADMIN', 'ADMIN', 'Administrador'].includes(user?.roleName ?? '');
    if (!isAdmin) {
        return (
            <div className="p-8 text-center text-slate-500">
                Você não tem permissão para alterar as configurações do sistema.
            </div>
        );
    }

    const handleSelectTheme = async (preset: typeof PRESET_COLORS[0]) => {
        setIsSaving(true);
        setMessage(null);
        try {
            // Apply it instantly in the browser Context
            applyTheme(preset.colors);
            setSelectedColorHex(preset.colors[600]);

            // Save to Backend
            await settingsApi.updateSystemSettings({
                themeConfig: preset.colors
            });
            
            setMessage({ type: 'success', text: 'Tema alterado com sucesso! Todo o sistema agora usará esta cor.' });
        } catch (err: any) {
            const errorData = err.response?.data;
            const errorText = typeof errorData === 'object' 
                ? (errorData.message || JSON.stringify(errorData)) 
                : (errorData || 'Erro ao salvar tema.');
            setMessage({ type: 'error', text: errorText });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveLogo = async () => {
        if (!selectedFile) return;
        setIsSaving(true);
        setMessage(null);
        try {
            // Upload to MinIO
            const formData = new FormData();
            formData.append('file', selectedFile);
            
            const uploadRes = await api.post('/uploads', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const uploadedUrl = uploadRes.data.url;

            // Save Theme Config
            await settingsApi.updateSystemSettings({
                themeConfig: { logoUrl: uploadedUrl }
            });
            
            setMessage({ type: 'success', text: 'Logo atualizada com sucesso! Recarregue a página para ver.' });
            setSelectedFile(null);
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Erro ao salvar a logo.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Cores Globais do Sistema</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Escolha uma cor abaixo. Esta cor será aplicada à toda interface para todos os usuários da empresa,
                    trazendo um aspecto de exclusividade para o sistema.
                </p>
            </div>

            {message && (
                <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {PRESET_COLORS.map(preset => {
                    const isSelected = selectedColorHex === preset.hex;

                    return (
                        <button
                            key={preset.id}
                            onClick={() => handleSelectTheme(preset)}
                            disabled={isSaving}
                            className={`
                                relative p-4 flex flex-col items-center gap-3 rounded-xl border-2 transition-all
                                hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:hover:scale-100
                                ${isSelected ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}
                            `}
                        >
                            {/* Color Bubble */}
                            <div 
                                className="w-12 h-12 rounded-full shadow-inner ring-4 ring-white"
                                style={{ backgroundColor: preset.hex }}
                            />
                            
                            <span className="text-sm font-medium text-slate-700 text-center leading-tight">
                                {preset.name}
                            </span>

                            {isSelected && (
                                <div className="absolute -top-2 -right-2 bg-white rounded-full">
                                    <CheckCircle2 className="w-6 h-6 text-brand-500 fill-brand-100" />
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
            <div className="mt-12 pt-8 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Sua Marca (Logo)</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4">
                    Faça upload de uma imagem (PNG/JPG) para substituir o logo padrão do sistema.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md items-start sm:items-center">
                    <input 
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 transition-all cursor-pointer"
                    />
                    <button 
                        onClick={handleSaveLogo}
                        disabled={isSaving || !selectedFile}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 font-medium transition-colors whitespace-nowrap"
                    >
                        {isSaving ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Upload size={16} />
                        )}
                        Enviar Logo
                    </button>
                </div>
            </div>
            
        </div>
    );
}
