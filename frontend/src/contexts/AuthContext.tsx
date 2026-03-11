import { createContext, useContext, useState, useEffect } from 'react';
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
    login: (token: string, permissions: any) => void;
    logout: () => void;
    isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Using a very simple JWT decode since we only need simple info
function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(localStorage.getItem('@ComprasModular:token'));
    const [user, setUser] = useState<UserContextData | null>(null);

    useEffect(() => {
        if (token) {
            const decoded = parseJwt(token);
            if (decoded) {
                setUser({
                    userId: decoded.user_id,
                    roleName: decoded.role_name,
                    name: decoded.name || '',
                    email: decoded.email || '',
                    departments: decoded.departments || []
                });
            }
        } else {
            setUser(null);
        }
    }, [token]);

    const login = (newToken: string, permissions: any) => {
        localStorage.setItem('@ComprasModular:token', newToken);
        localStorage.setItem('@ComprasModular:permissions', JSON.stringify(permissions));
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('@ComprasModular:token');
        localStorage.removeItem('@ComprasModular:permissions');
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
