import { cookies, headers } from 'next/headers';
import { getSessionsCollection } from '@/lib/mongodb';
import { generateToken } from '@/lib/auth';

// Mobile session durations
const MOBILE_ACCESS_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MOBILE_REFRESH_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

export interface MobileSessionData {
    authenticated: boolean;
    role: 'admin' | 'client' | null;
    userId?: string;
    userEmail?: string;
}

/**
 * Extract Bearer token from Authorization header
 */
async function getTokenFromHeader(): Promise<string | null> {
    try {
        const headerStore = await headers();
        const authHeader = headerStore.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.slice(7);
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Extract token from cookies (fallback for web-based mobile access)
 */
async function getTokenFromCookies(): Promise<{ accessToken: string | null; role: string | null; refreshToken: string | null }> {
    try {
        const cookieStore = await cookies();
        return {
            accessToken: cookieStore.get('mobile_access_token')?.value || null,
            role: cookieStore.get('mobile_role')?.value || null,
            refreshToken: cookieStore.get('mobile_refresh_token')?.value || null,
        };
    } catch {
        return { accessToken: null, role: null, refreshToken: null };
    }
}

/**
 * Create a mobile session in the database and set cookies
 */
export async function createMobileSession(
    userId: string,
    userEmail: string,
    role: 'admin' | 'client',
): Promise<{ accessToken: string; refreshToken: string }> {
    const sessions = await getSessionsCollection();
    const accessToken = generateToken();
    const refreshToken = generateToken();
    const now = new Date();

    // Store session in DB (same collection as web sessions)
    await sessions.insertOne({
        token: accessToken,
        userId,
        userEmail,
        role,
        ipAddress: 'mobile',
        userAgent: 'mobile-app',
        createdAt: now,
        expiresAt: new Date(now.getTime() + MOBILE_ACCESS_DURATION_MS),
        lastActivityAt: now,
    });

    // Store refresh token separately
    await sessions.insertOne({
        token: refreshToken,
        userId,
        userEmail,
        role,
        ipAddress: 'mobile-refresh',
        userAgent: 'mobile-app',
        createdAt: now,
        expiresAt: new Date(now.getTime() + MOBILE_REFRESH_DURATION_MS),
        lastActivityAt: now,
    });

    // Also set cookies (for web-based mobile access / fallback)
    try {
        const cookieStore = await cookies();

        cookieStore.set('mobile_access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: MOBILE_ACCESS_DURATION_MS / 1000,
            path: '/',
        });

        cookieStore.set('mobile_refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: MOBILE_REFRESH_DURATION_MS / 1000,
            path: '/',
        });

        cookieStore.set('mobile_role', role, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: MOBILE_REFRESH_DURATION_MS / 1000,
            path: '/',
        });

        if (role === 'client') {
            cookieStore.set('mobile_client_id', userId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: MOBILE_REFRESH_DURATION_MS / 1000,
                path: '/',
            });
        }
    } catch {
        // Cookie setting may fail in some contexts, tokens are still returned
    }

    return { accessToken, refreshToken };
}

/**
 * Verify mobile session - checks Authorization header first, then cookies
 */
export async function verifyMobileSession(): Promise<MobileSessionData | null> {
    try {
        // 1. Try Authorization: Bearer header first (React Native app)
        let accessToken = await getTokenFromHeader();
        let role: string | null = null;

        // 2. Fall back to cookies (web-based mobile access)
        if (!accessToken) {
            const cookieData = await getTokenFromCookies();
            accessToken = cookieData.accessToken;
            role = cookieData.role;
        }

        if (!accessToken) {
            return null;
        }

        // Validate token format (64-char hex)
        if (!/^[a-f0-9]{64}$/.test(accessToken)) {
            return null;
        }

        // Verify against database
        const sessions = await getSessionsCollection();
        const session = await sessions.findOne({ token: accessToken });

        if (!session) {
            return null;
        }

        const now = new Date();

        // Check if session expired
        if (session.expiresAt < now) {
            await sessions.deleteOne({ token: accessToken });
            return null;
        }

        // Check inactivity timeout
        if (session.lastActivityAt && (now.getTime() - new Date(session.lastActivityAt).getTime()) > INACTIVITY_TIMEOUT_MS) {
            await sessions.deleteOne({ token: accessToken });
            return null;
        }

        // If role came from cookie, verify it matches DB
        if (role && session.role !== role) {
            return null;
        }

        // Update last activity
        await sessions.updateOne(
            { token: accessToken },
            { $set: { lastActivityAt: now } }
        );

        return {
            authenticated: true,
            role: session.role,
            userId: session.userId,
            userEmail: session.userEmail,
        };
    } catch (error) {
        console.error('Mobile session verification error:', error);
        return null;
    }
}

/**
 * Refresh mobile access token using refresh token
 */
export async function refreshMobileSession(): Promise<{ success: boolean; accessToken?: string; role?: string }> {
    try {
        // Try Authorization header first (mobile app sends refresh token)
        let refreshToken = await getTokenFromHeader();

        // Fall back to cookie
        if (!refreshToken) {
            const cookieData = await getTokenFromCookies();
            refreshToken = cookieData.refreshToken;
        }

        if (!refreshToken || !/^[a-f0-9]{64}$/.test(refreshToken)) {
            return { success: false };
        }

        const sessions = await getSessionsCollection();
        const session = await sessions.findOne({ token: refreshToken });

        if (!session || session.expiresAt < new Date()) {
            if (session) await sessions.deleteOne({ token: refreshToken });
            return { success: false };
        }

        // Generate new access token
        const newAccessToken = generateToken();
        const now = new Date();

        // Store new access token in DB
        await sessions.insertOne({
            token: newAccessToken,
            userId: session.userId,
            userEmail: session.userEmail,
            role: session.role,
            ipAddress: 'mobile',
            userAgent: 'mobile-app',
            createdAt: now,
            expiresAt: new Date(now.getTime() + MOBILE_ACCESS_DURATION_MS),
            lastActivityAt: now,
        });

        // Try to update cookie too
        try {
            const cookieStore = await cookies();
            cookieStore.set('mobile_access_token', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: MOBILE_ACCESS_DURATION_MS / 1000,
                path: '/',
            });
        } catch {
            // Cookie update may fail, token is still returned
        }

        return { success: true, accessToken: newAccessToken, role: session.role };
    } catch (error) {
        console.error('Mobile token refresh error:', error);
        return { success: false };
    }
}

/**
 * Destroy mobile session (logout)
 */
export async function destroyMobileSession(): Promise<void> {
    try {
        const sessions = await getSessionsCollection();

        // Try Authorization header first
        const headerToken = await getTokenFromHeader();
        if (headerToken) {
            await sessions.deleteOne({ token: headerToken });
        }

        // Also clean up cookie-based tokens
        try {
            const cookieStore = await cookies();
            const accessToken = cookieStore.get('mobile_access_token')?.value;
            const refreshToken = cookieStore.get('mobile_refresh_token')?.value;

            if (accessToken) await sessions.deleteOne({ token: accessToken });
            if (refreshToken) await sessions.deleteOne({ token: refreshToken });

            // Clear cookies
            cookieStore.delete('mobile_access_token');
            cookieStore.delete('mobile_refresh_token');
            cookieStore.delete('mobile_client_id');
            cookieStore.delete('mobile_role');
        } catch {
            // Cookie cleanup may fail in some contexts
        }
    } catch (error) {
        console.error('Mobile session destruction error:', error);
    }
}
