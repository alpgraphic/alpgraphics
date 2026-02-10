/**
 * Premium Design System for alpgraphics Mobile
 * Matches web app: minimal, professional, designer-quality
 */

export const COLORS = {
    // Primary brand colors
    primary: '#a62932',        // Deep bordeaux
    primaryLight: 'rgba(166, 41, 50, 0.08)',
    primaryDark: '#8a222a',

    // Base colors
    background: '#f5f3e9',     // Warm ivory
    surface: '#ffffff',
    surfaceElevated: '#fafaf8',
    white: '#ffffff',

    // Text hierarchy
    text: '#1a1a1a',
    textSecondary: 'rgba(0, 0, 0, 0.55)',
    textMuted: 'rgba(0, 0, 0, 0.35)',
    textLight: 'rgba(0, 0, 0, 0.25)',
    textInverse: '#ffffff',

    // Borders & dividers
    border: 'rgba(0, 0, 0, 0.06)',
    divider: 'rgba(0, 0, 0, 0.04)',

    // Status colors (subtle)
    success: '#1a7f37',
    successLight: 'rgba(26, 127, 55, 0.08)',
    warning: '#9a6700',
    warningLight: 'rgba(154, 103, 0, 0.08)',
    error: '#cf222e',
    errorLight: 'rgba(207, 34, 46, 0.08)',
    blue: '#3b82f6',

    // Shadows
    shadowLight: 'rgba(0, 0, 0, 0.04)',
    shadowMedium: 'rgba(0, 0, 0, 0.08)',
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const FONTS = {
    // Weights
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,

    // Sizes
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 32,
    display: 40,
};

export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
};

// Token keys for secure storage
export const TOKEN_KEYS = {
    ACCESS_TOKEN: 'alpa_access_token',
    REFRESH_TOKEN: 'alpa_refresh_token',
    USER_DATA: 'alpa_user_data',
};

// Development API URL
export const API_BASE_URL = __DEV__
    ? 'http://192.168.1.90:3000'
    : 'https://alpgraphics.com';
