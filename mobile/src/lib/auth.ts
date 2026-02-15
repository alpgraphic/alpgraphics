import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { TOKEN_KEYS, API_BASE_URL } from './constants';

// Types
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface UserData {
    id: string;
    email: string;
    name: string;
    company: string;
    role: 'admin' | 'client';
}

export interface LoginResult {
    success: boolean;
    requires2FA?: boolean;
    adminId?: string;
    error?: string;
}

// Secure Storage
export const storage = {
    async get(key: string): Promise<string | null> {
        return SecureStore.getItemAsync(key);
    },
    async set(key: string, value: string): Promise<void> {
        await SecureStore.setItemAsync(key, value);
    },
    async delete(key: string): Promise<void> {
        await SecureStore.deleteItemAsync(key);
    },
};

// Auth Functions
export async function login(
    email: string,
    password: string,
    role: 'admin' | 'client'
): Promise<LoginResult> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/mobile/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role }),
        });

        const data = await response.json();

        // Admin 2FA required
        if (data.success && data.requires2FA) {
            return {
                success: false,
                requires2FA: true,
                adminId: data.adminId,
            };
        }

        // Direct login (client or admin without 2FA)
        if (data.success && data.accessToken) {
            await storage.set(TOKEN_KEYS.ACCESS_TOKEN, data.accessToken);
            await storage.set(TOKEN_KEYS.REFRESH_TOKEN, data.refreshToken);
            if (data.account) {
                await storage.set(TOKEN_KEYS.USER_DATA, JSON.stringify({
                    role,
                    ...data.account,
                }));
            }
            return { success: true };
        }

        return { success: false, error: data.error || 'Giris basarisiz' };
    } catch (error) {
        return { success: false, error: 'Baglanti hatasi' };
    }
}

// Verify 2FA code for admin
export async function verify2FA(
    adminId: string,
    code: string
): Promise<LoginResult> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/mobile/auth/verify-2fa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId, code }),
        });

        const data = await response.json();

        if (data.success && data.accessToken) {
            await storage.set(TOKEN_KEYS.ACCESS_TOKEN, data.accessToken);
            await storage.set(TOKEN_KEYS.REFRESH_TOKEN, data.refreshToken);
            if (data.account) {
                await storage.set(TOKEN_KEYS.USER_DATA, JSON.stringify({
                    role: 'admin',
                    ...data.account,
                }));
            }
            return { success: true };
        }

        return { success: false, error: data.error || 'Dogrulama basarisiz' };
    } catch (error) {
        return { success: false, error: 'Baglanti hatasi' };
    }
}

export async function logout(): Promise<void> {
    try {
        const accessToken = await storage.get(TOKEN_KEYS.ACCESS_TOKEN);
        if (accessToken) {
            // Notify server to destroy session
            await fetch(`${API_BASE_URL}/api/mobile/auth`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }).catch(() => {});
        }
    } finally {
        await storage.delete(TOKEN_KEYS.ACCESS_TOKEN);
        await storage.delete(TOKEN_KEYS.REFRESH_TOKEN);
        await storage.delete(TOKEN_KEYS.USER_DATA);
    }
}

export async function isAuthenticated(): Promise<boolean> {
    const token = await storage.get(TOKEN_KEYS.ACCESS_TOKEN);
    return !!token;
}

export async function getUserData(): Promise<UserData | null> {
    const data = await storage.get(TOKEN_KEYS.USER_DATA);
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
}

// Biometric Auth
export async function isBiometricAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
}

export async function authenticateWithBiometric(
    promptMessage: string = 'Kimliginizi dogrulayin'
): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Sifre ile giris',
        cancelLabel: 'Iptal',
    });
    return result.success;
}

// API Request with Auth
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
    const accessToken = await storage.get(TOKEN_KEYS.ACCESS_TOKEN);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                ...options.headers,
            },
        });

        const data = await response.json();
        return { success: response.ok, data, error: data.error };
    } catch (error) {
        return { success: false, error: 'Baglanti hatasi' };
    }
}
