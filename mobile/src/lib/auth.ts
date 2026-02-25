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
    role?: string;
    error?: string;
}

// Secure Storage
export const storage = {
    async get(key: string): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(key);
        } catch {
            return null;
        }
    },
    async set(key: string, value: string): Promise<void> {
        await SecureStore.setItemAsync(key, value);
    },
    async delete(key: string): Promise<void> {
        try {
            await SecureStore.deleteItemAsync(key);
        } catch {
            // Ignore delete errors
        }
    },
};

// Fetch with timeout
async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = 15000
): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeout);
    }
}

// Navigation callback for session expiry
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: () => void) {
    onSessionExpired = handler;
}

// Auth Functions
export async function login(
    username: string,
    password?: string // optional only to support admin flow where 2FA follows
): Promise<LoginResult> {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/api/mobile/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        // Admin 2FA required
        if (data.success && data.requires2FA) {
            return {
                success: false,
                requires2FA: true,
                adminId: data.adminId,
                role: data.role || 'admin',
            };
        }

        // Direct login success - validate response has tokens
        if (data.success && data.accessToken && data.refreshToken) {
            const role = data.role || 'client';
            await storage.set(TOKEN_KEYS.ACCESS_TOKEN, data.accessToken);
            await storage.set(TOKEN_KEYS.REFRESH_TOKEN, data.refreshToken);
            if (data.account) {
                await storage.set(TOKEN_KEYS.USER_DATA, JSON.stringify({
                    role,
                    ...data.account,
                }));
            } else {
                await storage.set(TOKEN_KEYS.USER_DATA, JSON.stringify({ role }));
            }
            return { success: true, role };
        }

        return { success: false, error: data.error || 'Giris basarisiz' };
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            return { success: false, error: 'Baglanti zaman asimina ugradi' };
        }
        return { success: false, error: 'Baglanti hatasi' };
    }
}

// Verify 2FA code for admin
export async function verify2FA(
    adminId: string,
    code: string
): Promise<LoginResult> {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/api/mobile/auth/verify-2fa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId, code }),
        });

        const data = await response.json();

        if (data.success && data.accessToken && data.refreshToken) {
            await storage.set(TOKEN_KEYS.ACCESS_TOKEN, data.accessToken);
            await storage.set(TOKEN_KEYS.REFRESH_TOKEN, data.refreshToken);
            await storage.set(TOKEN_KEYS.USER_DATA, JSON.stringify({
                role: 'admin',
                ...(data.account || {}),
            }));
            return { success: true };
        }

        return { success: false, error: data.error || 'Dogrulama basarisiz' };
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            return { success: false, error: 'Baglanti zaman asimina ugradi' };
        }
        return { success: false, error: 'Baglanti hatasi' };
    }
}

// Refresh access token using refresh token
async function refreshAccessToken(): Promise<boolean> {
    try {
        const refreshToken = await storage.get(TOKEN_KEYS.REFRESH_TOKEN);
        if (!refreshToken) return false;

        const response = await fetchWithTimeout(`${API_BASE_URL}/api/mobile/auth`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshToken}`,
            },
        }, 10000);

        const data = await response.json();

        if (data.success && data.accessToken) {
            await storage.set(TOKEN_KEYS.ACCESS_TOKEN, data.accessToken);
            return true;
        }

        return false;
    } catch {
        return false;
    }
}

export async function logout(): Promise<void> {
    try {
        // Remove push token FIRST (while we still have auth)
        const { removePushToken } = await import('./notifications');
        await removePushToken().catch(() => { });

        const accessToken = await storage.get(TOKEN_KEYS.ACCESS_TOKEN);
        if (accessToken) {
            await fetchWithTimeout(`${API_BASE_URL}/api/mobile/auth`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }, 5000).catch(() => { });
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
        const parsed = JSON.parse(data);
        // Validate structure
        if (parsed && typeof parsed === 'object' && parsed.role) {
            return parsed as UserData;
        }
        return null;
    } catch {
        return null;
    }
}

// Biometric Auth
export async function isBiometricAvailable(): Promise<boolean> {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return hasHardware && isEnrolled;
    } catch {
        return false;
    }
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

// API Request with Auth + Auto Token Refresh
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
    const accessToken = await storage.get(TOKEN_KEYS.ACCESS_TOKEN);

    // No token at all — session expired
    if (!accessToken) {
        onSessionExpired?.();
        return { success: false, error: 'Oturum suresi dolmus. Lutfen tekrar giris yapin.' };
    }

    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                ...options.headers,
            },
        });

        // Token expired — try refresh
        if (response.status === 401) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                // Retry with new token
                const newToken = await storage.get(TOKEN_KEYS.ACCESS_TOKEN);
                const retryResponse = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${newToken}`,
                        ...options.headers,
                    },
                });
                const retryData = await retryResponse.json();
                return { success: retryResponse.ok, data: retryData, error: retryData.error };
            }

            // Refresh also failed — session fully expired
            await storage.delete(TOKEN_KEYS.ACCESS_TOKEN);
            await storage.delete(TOKEN_KEYS.REFRESH_TOKEN);
            await storage.delete(TOKEN_KEYS.USER_DATA);
            onSessionExpired?.();
            return { success: false, error: 'Oturum suresi dolmus. Lutfen tekrar giris yapin.' };
        }

        const data = await response.json();
        return { success: response.ok, data, error: data?.error };
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            return { success: false, error: 'Istek zaman asimina ugradi' };
        }
        return { success: false, error: 'Baglanti hatasi' };
    }
}
