/**
 * Mobile API Client
 * Handles authentication, token management, and API calls for React Native apps
 */

// API Base URL - change this for production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Token storage keys
export const TOKEN_KEYS = {
    ACCESS_TOKEN: 'alpa_access_token',
    REFRESH_TOKEN: 'alpa_refresh_token',
    USER_ROLE: 'alpa_user_role',
    USER_DATA: 'alpa_user_data',
    SESSION_EXPIRY: 'alpa_session_expiry',
};

// Types
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    role: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface UserData {
    id: number;
    email: string;
    name: string;
    company: string;
    role: 'admin' | 'client';
}

/**
 * Mobile API Client Class
 * For use in React Native apps
 */
export class MobileApiClient {
    private baseUrl: string;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private onTokenRefresh?: (tokens: AuthTokens) => void;
    private onSessionExpired?: () => void;

    constructor(config?: {
        baseUrl?: string;
        onTokenRefresh?: (tokens: AuthTokens) => void;
        onSessionExpired?: () => void;
    }) {
        this.baseUrl = config?.baseUrl || API_BASE_URL;
        this.onTokenRefresh = config?.onTokenRefresh;
        this.onSessionExpired = config?.onSessionExpired;
    }

    // Set tokens (call after loading from secure storage)
    setTokens(accessToken: string, refreshToken: string) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

    // Clear tokens (on logout)
    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
    }

    // Login
    async login(email: string, password: string, role: 'admin' | 'client'): Promise<ApiResponse<AuthTokens>> {
        try {
            const response = await fetch(`${this.baseUrl}/api/mobile/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role }),
            });

            const data = await response.json();

            if (data.success && data.accessToken) {
                this.setTokens(data.accessToken, data.refreshToken);
                return {
                    success: true,
                    data: {
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken,
                        expiresIn: data.expiresIn,
                        role: data.role,
                    },
                };
            }

            return { success: false, error: data.error || 'Giriş başarısız' };
        } catch (error) {
            return { success: false, error: 'Bağlantı hatası' };
        }
    }

    // Refresh access token
    async refreshAccessToken(): Promise<boolean> {
        if (!this.refreshToken) {
            this.onSessionExpired?.();
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/mobile/auth`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken }),
            });

            const data = await response.json();

            if (data.success && data.accessToken) {
                this.accessToken = data.accessToken;
                this.onTokenRefresh?.({
                    accessToken: data.accessToken,
                    refreshToken: this.refreshToken,
                    expiresIn: data.expiresIn,
                    role: '',
                });
                return true;
            }

            this.onSessionExpired?.();
            return false;
        } catch (error) {
            return false;
        }
    }

    // Logout
    async logout(): Promise<void> {
        try {
            await fetch(`${this.baseUrl}/api/mobile/auth`, {
                method: 'DELETE',
            });
        } finally {
            this.clearTokens();
        }
    }

    // Authenticated API request with auto-refresh
    async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const makeRequest = async (): Promise<Response> => {
            return fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`,
                    ...options.headers,
                },
            });
        };

        let response = await makeRequest();

        // If 401, try to refresh token and retry
        if (response.status === 401 && this.refreshToken) {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                response = await makeRequest();
            } else {
                return { success: false, error: 'Oturum süresi doldu' };
            }
        }

        try {
            const data = await response.json();
            return { success: response.ok, data, error: data.error };
        } catch {
            return { success: false, error: 'Yanıt işlenemedi' };
        }
    }
}

// Singleton instance for web usage
export const mobileApi = new MobileApiClient();
