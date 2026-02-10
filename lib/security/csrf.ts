import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
    return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Set CSRF token cookie
 */
export async function setCSRFToken(): Promise<string> {
    const token = generateCSRFToken();
    const cookieStore = await cookies();

    cookieStore.set(CSRF_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60, // 1 hour
    });

    return token;
}

/**
 * Get current CSRF token from cookies
 */
export async function getCSRFToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Validate CSRF token from request
 * Compares header token with cookie token
 */
export async function validateCSRFToken(request: NextRequest): Promise<boolean> {
    // Get token from header
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    // Get token from cookie
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

    // Both must exist and match
    if (!headerToken || !cookieToken) {
        return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(headerToken),
            Buffer.from(cookieToken)
        );
    } catch {
        return false;
    }
}

/**
 * CSRF middleware - validates token for state-changing requests
 */
export async function csrfMiddleware(request: NextRequest): Promise<NextResponse | null> {
    // Only validate for state-changing methods
    const method = request.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return null;
    }

    // Skip CSRF for certain paths (e.g., public APIs, webhooks)
    const path = request.nextUrl.pathname;
    const skipPaths = [
        '/api/webhooks',
        '/api/exchange-rates',
        '/api/brief/', // Public brief form submission
    ];

    if (skipPaths.some(p => path.startsWith(p))) {
        return null;
    }

    // Validate CSRF token
    const isValid = await validateCSRFToken(request);

    if (!isValid) {
        return NextResponse.json(
            { error: 'Geçersiz CSRF token. Lütfen sayfayı yenileyin.' },
            { status: 403 }
        );
    }

    return null;
}

/**
 * Add CSRF token to response (for initial page load)
 */
export function addCSRFTokenToResponse(response: NextResponse, token: string): NextResponse {
    // Also expose token in a non-httpOnly cookie for JavaScript access
    response.cookies.set('csrf_token_client', token, {
        httpOnly: false, // JavaScript can read this
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60, // 1 hour
    });

    return response;
}
