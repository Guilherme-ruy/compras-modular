import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

type ThemeContextType = {
    isLoading: boolean;
    companyName: string;
    logoUrl?: string;
    applyTheme: (colors: Record<string, string>) => void;
    setLogo: (url: string | undefined) => void;
};

const ThemeContext = createContext<ThemeContextType>({ 
    isLoading: true,
    companyName: 'Compras Modular',
    logoUrl: undefined,
    applyTheme: () => {},
    setLogo: () => {}
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [companyName, setCompanyName] = useState('Compras Modular');
    const [logoUrl, setLogoUrl] = useState<string | undefined>();
    const { isAuthenticated, token } = useAuth();

    useEffect(() => {
        const fetchTheme = async () => {
            if (!isAuthenticated || !token) {
                // If not logged in, keep default theme and return immediately
                setIsLoading(false);
                return;
            }

            try {
                const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
                const response = await axios.get<any>(`${baseURL}/settings/theme`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data) {
                    if (response.data.companyName) {
                        setCompanyName(response.data.companyName);
                    }

                    const colors = response.data.themeConfig;
                    if (colors && typeof colors === 'object') {
                        if (colors.logoUrl) {
                            setLogoUrl(colors.logoUrl);
                        }
                        if (Object.keys(colors).filter(k => k !== 'logoUrl').length > 0) {
                            applyThemeColors(colors);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load theme configuration:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTheme();
    }, [isAuthenticated, token]);

    const applyThemeColors = (colors: Record<string, string>) => {
        const root = document.documentElement;
        Object.entries(colors).forEach(([key, value]) => {
            // Support both internal naming conventions
            root.style.setProperty(`--color-brand-${key}`, value);
            root.style.setProperty(`--color-primary-${key}`, value);
        });
    };

    return (
        <ThemeContext.Provider value={{ isLoading, companyName, logoUrl, applyTheme: applyThemeColors, setLogo: setLogoUrl }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
