import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

type ThemeConfigType = {
    primary: {
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
    };
};

type ThemeContextType = {
    isLoading: boolean;
    applyTheme: (colors: Record<string, string>) => void;
};

const ThemeContext = createContext<ThemeContextType>({ 
    isLoading: true,
    applyTheme: () => {} 
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTheme = async () => {
            try {
                const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
                const response = await axios.get<ThemeConfigType>(`${baseURL}/settings/theme`);

                if (response.data && response.data.primary) {
                    applyThemeColors(response.data.primary);
                }
            } catch (error) {
                console.error('Failed to load theme configuration:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTheme();
    }, []);

    const applyThemeColors = (colors: Record<string, string>) => {
        const root = document.documentElement;
        Object.entries(colors).forEach(([key, value]) => {
            // Support both internal naming conventions
            root.style.setProperty(`--color-brand-${key}`, value);
            root.style.setProperty(`--color-primary-${key}`, value);
        });
    };

    return (
        <ThemeContext.Provider value={{ isLoading, applyTheme: applyThemeColors }}>
            {/* Block rendering until theme arrives to avoid flash of unstyled content if we want,
          or just let fallback handle it. We will use fallback for simplicity. */}
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
