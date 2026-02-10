/**
 * Mobile Library Index
 * Re-exports all mobile utilities for easy importing
 */

export * from './api-client';
export * from './hooks';

// React Native specific utilities
// These will be implemented when creating the actual React Native app

/**
 * Secure Storage Factory
 * Returns the appropriate storage implementation based on platform
 */
export function createSecureStorage() {
    // Check if we're in React Native
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
        // Return SecureStore implementation
        // import * as SecureStore from 'expo-secure-store';
        // return {
        //     getItem: SecureStore.getItemAsync,
        //     setItem: SecureStore.setItemAsync,
        //     deleteItem: SecureStore.deleteItemAsync,
        // };
    }

    // Web fallback
    return {
        getItem: async (key: string) => localStorage.getItem(key),
        setItem: async (key: string, value: string) => localStorage.setItem(key, value),
        deleteItem: async (key: string) => localStorage.removeItem(key),
    };
}

/**
 * App Constants
 */
export const APP_CONFIG = {
    name: 'alpgraphics',
    version: '1.0.0',
    iosAppId: 'com.alpgraphics.client', // App Store ID
    androidPackage: 'com.alpgraphics.client', // Play Store package

    // API Configuration
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '',

    // Token Configuration
    accessTokenExpiry: 15 * 60, // 15 minutes in seconds
    refreshTokenExpiry: 7 * 24 * 60 * 60, // 7 days in seconds

    // Biometric Configuration
    biometricPrompt: 'Kimliğinizi doğrulayın',
    biometricFallbackLabel: 'Şifre ile giriş',

    // Offline Configuration
    offlineCacheDuration: 24 * 60 * 60 * 1000, // 24 hours in ms

    // Theme
    colors: {
        primary: '#a62932',
        secondary: '#4a1215',
        background: '#f5f3e9',
        text: '#1a1a1a',
        white: '#ffffff',
        success: '#22c55e',
        warning: '#eab308',
        error: '#ef4444',
    },
};

/**
 * Deep Link Configuration
 * For handling app links (iOS Universal Links / Android App Links)
 */
export const DEEP_LINK_CONFIG = {
    scheme: 'alpgraphics',
    prefix: ['alpgraphics://', 'https://alpgraphics.com'],
    routes: {
        login: '/login',
        dashboard: '/client/dashboard',
        brief: '/brief/:id',
        project: '/project/:id',
    },
};
