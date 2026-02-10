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
    id: number;
    email: string;
    name: string;
    company: string;
    role: 'admin' | 'client';
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
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/mobile/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role }),
        });

        const data = await response.json();

        if (data.success && data.accessToken) {
            await storage.set(TOKEN_KEYS.ACCESS_TOKEN, data.accessToken);
            await storage.set(TOKEN_KEYS.REFRESH_TOKEN, data.refreshToken);
            return { success: true };
        }

        return { success: false, error: data.error || 'Giriş başarısız' };
    } catch (error) {
        return { success: false, error: 'Bağlantı hatası' };
    }
}

export async function logout(): Promise<void> {
    await storage.delete(TOKEN_KEYS.ACCESS_TOKEN);
    await storage.delete(TOKEN_KEYS.REFRESH_TOKEN);
    await storage.delete(TOKEN_KEYS.USER_DATA);
}

export async function isAuthenticated(): Promise<boolean> {
    const token = await storage.get(TOKEN_KEYS.ACCESS_TOKEN);
    return !!token;
}

// Biometric Auth
export async function isBiometricAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
}

export async function authenticateWithBiometric(
    promptMessage: string = 'Kimliğinizi doğrulayın'
): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Şifre ile giriş',
        cancelLabel: 'İptal',
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
        return { success: false, error: 'Bağlantı hatası' };
    }
}
