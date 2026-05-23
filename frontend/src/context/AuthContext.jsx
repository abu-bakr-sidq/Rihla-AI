import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Here we would typically validate the token or fetch `/api/auth/me`
        const checkAuth = async () => {
            try {
                const res = await api.get('/auth/me');
                setUser(res.data);
            } catch (err) {
                // Not authenticated
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (credentials) => {
        const res = await api.post('/auth/login', credentials);
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
    };

    const register = async (userData) => {
        const res = await api.post('/auth/register', userData);
        // Do not auto-login, or handle login token explicitly depending on setup
        return res.data;
    };

    const logout = async () => {
        await api.post('/auth/logout');
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
