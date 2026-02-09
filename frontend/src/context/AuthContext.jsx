import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// Token refresh interval: 25 minutes (before 30-minute expiry)
const TOKEN_REFRESH_INTERVAL = 25 * 60 * 1000;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const refreshIntervalRef = useRef(null);

    const refreshAccessToken = async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return false;

        try {
            const data = await api.refreshToken(refreshToken);
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            console.log('Token refreshed successfully');
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            setUser(null);
            return false;
        }
    };

    const startTokenRefreshInterval = () => {
        // Clear any existing interval
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
        }
        // Set up new interval to refresh token every 25 minutes
        refreshIntervalRef.current = setInterval(refreshAccessToken, TOKEN_REFRESH_INTERVAL);
    };

    const stopTokenRefreshInterval = () => {
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const userData = await api.getMe();
                    setUser(userData);
                    startTokenRefreshInterval();
                } catch (error) {
                    console.error('Initial auth failed:', error);
                    // Try to refresh the token if initial auth fails
                    const refreshed = await refreshAccessToken();
                    if (refreshed) {
                        try {
                            const userData = await api.getMe();
                            setUser(userData);
                            startTokenRefreshInterval();
                        } catch (retryError) {
                            console.error('Auth retry failed:', retryError);
                        }
                    }
                }
            }
            setLoading(false);
        };

        initAuth();

        // Cleanup interval on unmount
        return () => stopTokenRefreshInterval();
    }, []);

    const login = async (email, password) => {
        const data = await api.login({ email, password });
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        const userData = await api.getMe();
        setUser(userData);
        startTokenRefreshInterval();
        return userData;
    };

    const signup = async (userData) => {
        await api.signup(userData);
        // Automatically login after signup
        return login(userData.email, userData.password);
    };

    const logout = () => {
        stopTokenRefreshInterval();
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
