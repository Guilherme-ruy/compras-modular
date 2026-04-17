import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type UserContextData = {
    userId: string;
    roleName: string;
    name: string;
    email: string;
    departments: string[];
};

type AuthContextType = {
    token: string | null;
    user: UserContextData | null;
    login: (token: string, permissions: unknown) => void;
    logout: () => void;
    updateUser: (updates: Partial<UserContextData>) => void;
    isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function parseJwt(token: string): Record<string, unknown> | null {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            window.atob(base64).split('').map((c) =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

function buildUserFromToken(token: string | null): UserContextData | null {
    if (!token) return null;
    const decoded = parseJwt(token);
    if (!decoded) return null;
    return {
        userId: decoded.sub as string,
        roleName: decoded.roleName as string,
        name: (decoded.name as string) || '',
        email: (decoded.email as string) || '',
        departments: (decoded.departments as string[]) || [],
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem('@ComprasModular:token')
    );
    // Derive user synchronously from token on first render — no flash
    const [user, setUser] = useState<UserContextData | null>(
        () => buildUserFromToken(localStorage.getItem('@ComprasModular:token'))
    );

    const login = (newToken: string, permissions: unknown) => {
        localStorage.setItem('@ComprasModular:token', newToken);
        localStorage.setItem('@ComprasModular:permissions', JSON.stringify(permissions));
        setToken(newToken);
        setUser(buildUserFromToken(newToken));
    };

    const updateUser = (updates: Partial<UserContextData>) => {
        setUser((currentUser) => {
            if (!currentUser) return currentUser;
            return { ...currentUser, ...updates };
        });
    };

    const logout = () => {
        localStorage.removeItem('@ComprasModular:token');
        localStorage.removeItem('@ComprasModular:permissions');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, updateUser, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
