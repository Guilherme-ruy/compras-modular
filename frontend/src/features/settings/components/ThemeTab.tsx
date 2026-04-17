import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { settingsApi } from '../api/settingsApi';
import { PRESET_COLORS, type ThemeColors } from '../types';
import { CheckCircle2 } from 'lucide-react';

export default function ThemeTab({ initialColors }: { initialColors?: ThemeColors }) {
    const { user } = useAuth();
    const { applyTheme } = useTheme();
    
    // Find matching preset by checking if the primary 600 color exists
    const [selectedColorHex, setSelectedColorHex] = useState<string>(
        initialColors ? initialColors[600] : PRESET_COLORS[0].hex
    );
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    // Only SUPERADMIN/ADMIN can see this tab (safeguard)
    const isAdmin = user?.roleName === 'SUPERADMIN' || user?.roleName === 'ADMIN';
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
            
        </div>
    );
}
