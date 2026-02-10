'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Hook to manage CSRF tokens for secure form submissions
 */
export function useCSRF() {
    const [csrfToken, setCsrfToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch CSRF token on mount
    useEffect(() => {
        async function fetchToken() {
            try {
                const res = await fetch('/api/csrf');
                const data = await res.json();
                if (data.csrfToken) {
                    setCsrfToken(data.csrfToken);
                }
            } catch (error) {
                console.error('Failed to fetch CSRF token:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchToken();
    }, []);

    // Refresh token (useful after session changes)
    const refreshToken = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/csrf');
            const data = await res.json();
            if (data.csrfToken) {
                setCsrfToken(data.csrfToken);
            }
        } catch (error) {
            console.error('Failed to refresh CSRF token:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Get headers with CSRF token
    const getHeaders = useCallback((additionalHeaders?: Record<string, string>) => {
        return {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
            ...additionalHeaders,
        };
    }, [csrfToken]);

    // Secure fetch wrapper
    const secureFetch = useCallback(async (
        url: string,
        options: RequestInit = {}
    ): Promise<Response> => {
        const headers = {
            ...getHeaders(),
            ...(options.headers as Record<string, string> || {}),
        };

        return fetch(url, {
            ...options,
            headers,
        });
    }, [getHeaders]);

    return {
        csrfToken,
        loading,
        refreshToken,
        getHeaders,
        secureFetch,
    };
}

/**
 * Get CSRF token from cookie (for non-hook usage)
 */
export function getCSRFTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    const match = document.cookie.match(/csrf_token_client=([^;]+)/);
    return match ? match[1] : null;
}
