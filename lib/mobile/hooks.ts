/**
 * React Native Hooks for Mobile App
 * These hooks are designed to work with React Native and Expo
 */

// Note: This file contains hook implementations that will work in React Native
// When used in web (Next.js), localStorage is used as fallback
// In React Native, use SecureStore from expo-secure-store

import { useState, useEffect, useCallback } from 'react';
import { MobileApiClient, AuthTokens, TOKEN_KEYS, UserData } from './api-client';

// Storage interface (implement differently for web vs native)
interface SecureStorage {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    deleteItem: (key: string) => Promise<void>;
}

// Web storage fallback (for development/testing in browser)
const webStorage: SecureStorage = {
    getItem: async (key) => localStorage.getItem(key),
    setItem: async (key, value) => localStorage.setItem(key, value),
    deleteItem: async (key) => localStorage.removeItem(key),
};

/**
 * useAuth Hook
 * Manages authentication state and provides login/logout functions
 */
export function useAuth(storage: SecureStorage = webStorage) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<UserData | null>(null);
    const [role, setRole] = useState<'admin' | 'client' | null>(null);

    const apiClient = new MobileApiClient({
        onSessionExpired: () => {
            setIsAuthenticated(false);
            setUser(null);
            setRole(null);
        },
        onTokenRefresh: async (tokens) => {
            await storage.setItem(TOKEN_KEYS.ACCESS_TOKEN, tokens.accessToken);
        },
    });

    // Check existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const accessToken = await storage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
                const refreshToken = await storage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
                const userData = await storage.getItem(TOKEN_KEYS.USER_DATA);
                const userRole = await storage.getItem(TOKEN_KEYS.USER_ROLE);

                if (accessToken && refreshToken) {
                    apiClient.setTokens(accessToken, refreshToken);
                    setIsAuthenticated(true);
                    if (userData) setUser(JSON.parse(userData));
                    if (userRole) setRole(userRole as 'admin' | 'client');
                }
            } catch (error) {
                console.error('Session check failed:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    // Login function
    const login = useCallback(async (
        email: string,
        password: string,
        loginRole: 'admin' | 'client'
    ): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);

        const result = await apiClient.login(email, password, loginRole);

        if (result.success && result.data) {
            // Store tokens securely
            await storage.setItem(TOKEN_KEYS.ACCESS_TOKEN, result.data.accessToken);
            await storage.setItem(TOKEN_KEYS.REFRESH_TOKEN, result.data.refreshToken);
            await storage.setItem(TOKEN_KEYS.USER_ROLE, result.data.role);

            setIsAuthenticated(true);
            setRole(result.data.role as 'admin' | 'client');
            setIsLoading(false);

            return { success: true };
        }

        setIsLoading(false);
        return { success: false, error: result.error };
    }, [apiClient, storage]);

    // Logout function
    const logout = useCallback(async () => {
        await apiClient.logout();
        await storage.deleteItem(TOKEN_KEYS.ACCESS_TOKEN);
        await storage.deleteItem(TOKEN_KEYS.REFRESH_TOKEN);
        await storage.deleteItem(TOKEN_KEYS.USER_DATA);
        await storage.deleteItem(TOKEN_KEYS.USER_ROLE);

        setIsAuthenticated(false);
        setUser(null);
        setRole(null);
    }, [apiClient, storage]);

    return {
        isAuthenticated,
        isLoading,
        user,
        role,
        login,
        logout,
        apiClient,
    };
}

/**
 * useBiometric Hook
 * Handles biometric authentication (Face ID / Touch ID / Fingerprint)
 * Note: Requires expo-local-authentication in React Native
 */
export function useBiometric() {
    const [isAvailable, setIsAvailable] = useState(false);
    const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | null>(null);

    // Check availability (web fallback - always false)
    useEffect(() => {
        const checkBiometrics = async () => {
            // In React Native with Expo:
            // import * as LocalAuthentication from 'expo-local-authentication';
            // const hasHardware = await LocalAuthentication.hasHardwareAsync();
            // const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

            // Web fallback
            if (typeof window !== 'undefined') {
                // Check for WebAuthn support (experimental)
                setIsAvailable(!!window.PublicKeyCredential);
            }
        };

        checkBiometrics();
    }, []);

    // Authenticate with biometrics
    const authenticate = useCallback(async (promptMessage: string = 'Kimliğinizi doğrulayın'): Promise<boolean> => {
        // In React Native with Expo:
        // const result = await LocalAuthentication.authenticateAsync({
        //     promptMessage,
        //     fallbackLabel: 'Şifre ile giriş',
        // });
        // return result.success;

        // Web fallback - just return true for development
        return true;
    }, []);

    return {
        isAvailable,
        biometricType,
        authenticate,
    };
}

/**
 * useOfflineSync Hook
 * Manages offline data synchronization
 */
export function useOfflineSync<T>(key: string, storage: SecureStorage = webStorage) {
    const [data, setData] = useState<T | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);

    // Load cached data
    useEffect(() => {
        const loadCached = async () => {
            try {
                const cached = await storage.getItem(`cache_${key}`);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    setData(parsed.data);
                    setLastSynced(new Date(parsed.timestamp));
                }
            } catch (error) {
                console.error('Failed to load cached data:', error);
            }
        };

        loadCached();
    }, [key, storage]);

    // Save data to cache
    const saveToCache = useCallback(async (newData: T) => {
        try {
            await storage.setItem(`cache_${key}`, JSON.stringify({
                data: newData,
                timestamp: new Date().toISOString(),
            }));
            setData(newData);
            setLastSynced(new Date());
        } catch (error) {
            console.error('Failed to save to cache:', error);
        }
    }, [key, storage]);

    // Sync with server
    const sync = useCallback(async (fetchFn: () => Promise<T>): Promise<boolean> => {
        setIsSyncing(true);
        try {
            const freshData = await fetchFn();
            await saveToCache(freshData);
            return true;
        } catch (error) {
            console.error('Sync failed:', error);
            return false;
        } finally {
            setIsSyncing(false);
        }
    }, [saveToCache]);

    return {
        data,
        isSyncing,
        lastSynced,
        saveToCache,
        sync,
    };
}
