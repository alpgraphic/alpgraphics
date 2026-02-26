import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const method = request.method;

    // ─── SECURITY HEADERS ───
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data: blob:; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-ancestors 'none';"
    );

    // ─── CORS (For Mobile) ───
    if (path.startsWith('/api/mobile/')) {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        // Handle CORS Preflight completely
        if (method === 'OPTIONS') {
            return new NextResponse(null, { status: 204, headers: response.headers });
        }
    }

    // ─── ORIGIN CHECK (CSRF Protection via Origin/Referer) ───
    // Protects state-changing API requests from cross-origin attacks
    if (path.startsWith('/api/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        const exemptPaths = [
            '/api/auth/login',
            '/api/auth/setup',
            '/api/auth/verify-2fa',
            '/api/csrf',
            '/api/brief/',
            '/api/exchange-rates',
            '/api/mobile/',
        ];
        const isExempt = exemptPaths.some(exempt => path.startsWith(exempt));

        if (!isExempt) {
            const origin = request.headers.get('origin');
            const referer = request.headers.get('referer');
            const host = request.headers.get('host');

            // In production, verify origin matches host
            if (origin && host) {
                const originHost = new URL(origin).host;
                if (originHost !== host) {
                    return NextResponse.json(
                        { error: 'Cross-origin request rejected' },
                        { status: 403 }
                    );
                }
            } else if (referer && host) {
                const refererHost = new URL(referer).host;
                if (refererHost !== host) {
                    return NextResponse.json(
                        { error: 'Cross-origin request rejected' },
                        { status: 403 }
                    );
                }
            }
            // If neither origin nor referer present in production, block
            // (browsers always send origin for POST/PUT/DELETE)
            if (process.env.NODE_ENV === 'production' && !origin && !referer) {
                return NextResponse.json(
                    { error: 'Missing origin header' },
                    { status: 403 }
                );
            }
        }
    }

    // ─── ADMIN ROUTE PROTECTION ───
    // Allow setup page without auth (it self-protects if admin already exists)
    if (path === '/admin/setup') {
        return response;
    }

    if (path.startsWith('/admin')) {
        const sessionToken = request.cookies.get('session_token')?.value;
        const userRole = request.cookies.get('user_role')?.value;
        const userId = request.cookies.get('user_id')?.value;
        const sessionExpiry = request.cookies.get('session_expiry')?.value;

        if (!sessionToken || !userId || userRole !== 'admin') {
            const res = NextResponse.redirect(new URL('/login', request.url));
            if (sessionToken && userRole !== 'admin') {
                res.cookies.delete('session_token');
                res.cookies.delete('user_role');
                res.cookies.delete('user_id');
                res.cookies.delete('session_expiry');
            }
            return res;
        }

        // Token format validation (must be 64 hex chars)
        if (!/^[a-f0-9]{64}$/.test(sessionToken)) {
            const res = NextResponse.redirect(new URL('/login', request.url));
            res.cookies.delete('session_token');
            res.cookies.delete('user_role');
            res.cookies.delete('user_id');
            res.cookies.delete('session_expiry');
            return res;
        }

        // Check session expiry timestamp (if set)
        if (sessionExpiry) {
            const expiryTime = parseInt(sessionExpiry, 10);
            if (!isNaN(expiryTime) && Date.now() > expiryTime) {
                const res = NextResponse.redirect(new URL('/login', request.url));
                res.cookies.delete('session_token');
                res.cookies.delete('user_role');
                res.cookies.delete('user_id');
                res.cookies.delete('session_expiry');
                return res;
            }
        }
    }

    // ─── CLIENT PORTAL PROTECTION ───
    if (path.startsWith('/client')) {
        const sessionToken = request.cookies.get('session_token')?.value;
        const userRole = request.cookies.get('user_role')?.value;
        const userId = request.cookies.get('user_id')?.value;
        const sessionExpiry = request.cookies.get('session_expiry')?.value;

        if (!sessionToken || !userId || (userRole !== 'client' && userRole !== 'admin')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Check session expiry timestamp (if set)
        if (sessionExpiry) {
            const expiryTime = parseInt(sessionExpiry, 10);
            if (!isNaN(expiryTime) && Date.now() > expiryTime) {
                const res = NextResponse.redirect(new URL('/login', request.url));
                res.cookies.delete('session_token');
                res.cookies.delete('user_role');
                res.cookies.delete('user_id');
                res.cookies.delete('session_expiry');
                return res;
            }
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/client/:path*',
        '/api/:path*',
    ],
};
