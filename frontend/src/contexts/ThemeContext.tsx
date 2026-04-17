import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

type ThemeContextType = {
    isLoading: boolean;
    companyName: string;
    applyTheme: (colors: Record<string, string>) => void;
};

const ThemeContext = createContext<ThemeContextType>({ 
    isLoading: true,
    companyName: 'Compras Modular',
    applyTheme: () => {} 
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [companyName, setCompanyName] = useState('Compras Modular');

    useEffect(() => {
        const fetchTheme = async () => {
            try {
                const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
                const response = await axios.get<any>(`${baseURL}/settings/theme`);

                if (response.data) {
                    if (response.data.companyName) {
                        setCompanyName(response.data.companyName);
                    }

                    const colors = response.data.themeConfig;
                    if (colors && typeof colors === 'object' && Object.keys(colors).length > 0) {
                        applyThemeColors(colors);
                    }
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
        <ThemeContext.Provider value={{ isLoading, companyName, applyTheme: applyThemeColors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
