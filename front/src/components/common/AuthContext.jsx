import React, { createContext, useContext, useEffect, useState } from 'react';
import { me } from '@/lib/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const tokenKey = import.meta.env.VITE_TOKEN_KEY;

    const getToken = () => localStorage.getItem(tokenKey);

    const getUser = async () => {

        if (!getToken()) {
            setIsLoading(false);
            return;
        }

        try {
            const { userData } = await me();
            const userString = JSON.stringify(userData);
            console.log(`Log user: ${userString}`);
            setUser(userData);

        } catch (error) {
            console.error("Failed to fetch user: ", error);
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (token) => {
        localStorage.setItem(tokenKey, token);
        await getUser();
    };

    const logout = () => {
        localStorage.removeItem(tokenKey);
        setUser(null);
    };

    useEffect(() => {
        getUser();
    }, []);

    const value = {
        user,
        isLoading,
        isAuthenticated: !!getToken() && !!user,
        login,
        logout,
        refreshUser: getUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used within AuthProvider");
    }
    return context;
}