import { cookies } from 'next/headers';
import { getSessionsCollection, DbSession } from '@/lib/mongodb';
import { generateToken } from '@/lib/auth';

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// Session inactivity timeout: 2 hours
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000;

export interface SessionData {
    authenticated: boolean;
    role: 'admin' | 'client' | null;
    userId?: string;
    userEmail?: string;
}

/**
 * Create a new session in the database and set cookies
 */
export async function createSession(
    userId: string,
    userEmail: string,
    role: 'admin' | 'client',
    ipAddress?: string,
    userAgent?: string
): Promise<string> {
    const sessions = await getSessionsCollection();
    const token = generateToken();
    const now = new Date();

    const session: DbSession = {
        token,
        userId,
        userEmail,
        role,
        ipAddress,
        userAgent,
        createdAt: now,
        expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
        lastActivityAt: now,
    };

    await sessions.insertOne(session);

    // Set cookies
    const cookieStore = await cookies();

    cookieStore.set('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION_MS / 1000,
        path: '/',
    });

    cookieStore.set('user_role', role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION_MS / 1000,
        path: '/',
    });

    return token;
}

/**
 * Verify session from cookies against database
 */
export async function verifySession(): Promise<SessionData> {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('session_token')?.value;
        const userRole = cookieStore.get('user_role')?.value;

        if (!sessionToken || !userRole) {
            return { authenticated: false, role: null };
        }

        // Verify token format
        if (sessionToken.length < 32) {
            return { authenticated: false, role: null };
        }

        // Verify against database
        const sessions = await getSessionsCollection();
        const session = await sessions.findOne({ token: sessionToken });

        if (!session) {
            return { authenticated: false, role: null };
        }

        const now = new Date();

        // Check if session expired
        if (session.expiresAt < now) {
            await sessions.deleteOne({ token: sessionToken });
            return { authenticated: false, role: null };
        }

        // Check for inactivity timeout
        const inactiveFor = now.getTime() - session.lastActivityAt.getTime();
        if (inactiveFor > INACTIVITY_TIMEOUT_MS) {
            await sessions.deleteOne({ token: sessionToken });
            return { authenticated: false, role: null };
        }

        // Verify role matches cookie
        if (session.role !== userRole) {
            await sessions.deleteOne({ token: sessionToken });
            return { authenticated: false, role: null };
        }

        // Update last activity
        await sessions.updateOne(
            { token: sessionToken },
            { $set: { lastActivityAt: now } }
        );

        return {
            authenticated: true,
            role: session.role,
            userId: session.userId,
            userEmail: session.userEmail,
        };
    } catch (error) {
        console.error('Session verification error:', error);
        return { authenticated: false, role: null };
    }
}

/**
 * Check if current session is admin
 */
export async function isAdmin(): Promise<boolean> {
    const session = await verifySession();
    return session.authenticated && session.role === 'admin';
}

/**
 * Require admin authentication - returns error if not admin
 */
export async function requireAdmin(): Promise<{ authorized: true; session: SessionData } | { authorized: false; error: string }> {
    const session = await verifySession();

    if (!session.authenticated) {
        return { authorized: false, error: 'Oturum açmanız gerekiyor' };
    }

    if (session.role !== 'admin') {
        return { authorized: false, error: 'Bu işlem için admin yetkisi gerekiyor' };
    }

    return { authorized: true, session };
}

/**
 * Require any authentication
 */
export async function requireAuth(): Promise<{ authorized: true; session: SessionData } | { authorized: false; error: string }> {
    const session = await verifySession();

    if (!session.authenticated || !session.role) {
        return { authorized: false, error: 'Oturum açmanız gerekiyor' };
    }

    return { authorized: true, session };
}

/**
 * Destroy session (logout)
 */
export async function destroySession(): Promise<void> {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('session_token')?.value;

        if (sessionToken) {
            const sessions = await getSessionsCollection();
            await sessions.deleteOne({ token: sessionToken });
        }

        cookieStore.delete('session_token');
        cookieStore.delete('user_role');
    } catch (error) {
        console.error('Session destruction error:', error);
    }
}

/**
 * Delete all sessions for a user (force logout everywhere)
 */
export async function destroyAllUserSessions(userId: string): Promise<void> {
    const sessions = await getSessionsCollection();
    await sessions.deleteMany({ userId });
}

/**
 * Cleanup expired sessions (call via cron or periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
    const sessions = await getSessionsCollection();
    const result = await sessions.deleteMany({
        $or: [
            { expiresAt: { $lt: new Date() } },
            { lastActivityAt: { $lt: new Date(Date.now() - INACTIVITY_TIMEOUT_MS) } }
        ]
    });
    return result.deletedCount;
}
