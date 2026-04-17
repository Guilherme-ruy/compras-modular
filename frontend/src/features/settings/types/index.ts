// Elegância Segura: 8 Premium Color Presets

export interface ThemeColors {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
    [key: string]: string; // Support index access for mapping loops
}

export interface ColorPreset {
    id: string;
    name: string;
    hex: string; // The primary 600 color used for preview
    colors: ThemeColors;
}

export const PRESET_COLORS: ColorPreset[] = [
    {
        id: 'emerald',
        name: 'Verde Esmeralda',
        hex: '#059669',
        colors: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
            950: '#022c22'
        }
    },
    {
        id: 'ocean',
        name: 'Azul Oceano',
        hex: '#0284c7',
        colors: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e',
            950: '#082f49'
        }
    },
    {
        id: 'indigo',
        name: 'Roxo Startup',
        hex: '#4f46e5',
        colors: {
            50: '#eef2ff',
            100: '#e0e7ff',
            200: '#c7d2fe',
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1',
            600: '#4f46e5',
            700: '#4338ca',
            800: '#3730a3',
            900: '#312e81',
            950: '#1e1b4b'
        }
    },
    {
        id: 'rose',
        name: 'Rosa Elegante',
        hex: '#e11d48',
        colors: {
            50: '#fff1f2',
            100: '#ffe4e6',
            200: '#fecdd3',
            300: '#fda4af',
            400: '#fb7185',
            500: '#f43f5e',
            600: '#e11d48',
            700: '#be123c',
            800: '#9f1239',
            900: '#881337',
            950: '#4c0519'
        }
    },
    {
        id: 'amber',
        name: 'Amarelo Ouro',
        hex: '#d97706',
        colors: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
            950: '#451a03'
        }
    },
    {
        id: 'slate',
        name: 'Cinza High-Tech',
        hex: '#475569',
        colors: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
            950: '#020617'
        }
    },
    {
        id: 'red',
        name: 'Vermelho Ruby',
        hex: '#dc2626',
        colors: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
            950: '#450a0a'
        }
    },
    {
        id: 'teal',
        name: 'Verde Petróleo',
        hex: '#0d9488',
        colors: {
            50: '#f0fdfa',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6',
            600: '#0d9488',
            700: '#0f766e',
            800: '#115e59',
            900: '#134e4a',
            950: '#042f2e'
        }
    }
];

export interface SystemSettings {
    id: number;
    companyName: string;
    document: string;
    themeConfig: ThemeColors;
}

export interface UserProfileUpdate {
    name?: string;
    email?: string;
    password?: string;
}
