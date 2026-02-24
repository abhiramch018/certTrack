import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser && token) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                logout();
            }
        }
    }, []);

    const login = (tokenValue, userData) => {
        localStorage.setItem('token', tokenValue);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(tokenValue);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
