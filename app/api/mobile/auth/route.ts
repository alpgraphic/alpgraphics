import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAccountsCollection } from '@/lib/mongodb';
import { checkRateLimit, getClientIP } from '@/lib/security/rateLimit';
import { createMobileSession, refreshMobileSession, destroyMobileSession } from '@/lib/auth/mobileSession';

interface TokenResponse {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    role?: string;
    account?: {
        id: string;
        name: string;
        email: string;
        company: string;
        username?: string;
    };
    error?: string;
}

// Generic error to prevent user enumeration
const INVALID_CREDENTIALS_MSG = 'Kullanıcı adı veya şifre hatalı';

// POST /api/mobile/auth - Login (username-based, password required)
export async function POST(request: NextRequest): Promise<NextResponse<TokenResponse>> {
    try {
        const ip = getClientIP(request);

        // Rate limiting
        const rateCheck = await checkRateLimit(ip, '/api/mobile/auth', 'auth');
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { success: false, error: 'Çok fazla giriş denemesi. Lütfen bekleyin.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { username, password } = body;

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Kullanıcı adı gereklidir' },
                { status: 400 }
            );
        }

        const usernameStr = String(username).toLowerCase().trim();
        const accounts = await getAccountsCollection();

        // Find account by username field, or fall back to email (backward compat)
        const account = await accounts.findOne({
            $or: [
                { username: usernameStr },
                { email: usernameStr }
            ]
        } as any);

        if (!account) {
            // Constant-time dummy compare to prevent timing attacks
            if (password) await bcrypt.compare(password, '$2a$12$invalidhashpaddingtomakeitsamelengthasbcrypt');
            return NextResponse.json(
                { success: false, error: INVALID_CREDENTIALS_MSG },
                { status: 401 }
            );
        }

        const isAdmin = account.role === 'admin';

        if (isAdmin) {
            // Admin requires password
            if (!password || !account.passwordHash) {
                return NextResponse.json(
                    { success: false, error: INVALID_CREDENTIALS_MSG },
                    { status: 401 }
                );
            }

            const isValidPassword = await bcrypt.compare(password, account.passwordHash);
            if (!isValidPassword) {
                return NextResponse.json(
                    { success: false, error: INVALID_CREDENTIALS_MSG },
                    { status: 401 }
                );
            }

            // Admin requires 2FA
            if (account.twoFactorSecret) {
                return NextResponse.json({
                    success: true,
                    requires2FA: true,
                    adminId: account._id!.toString(),
                    role: 'admin',
                });
            }

            // No 2FA secret set — block login
            return NextResponse.json(
                { success: false, error: '2FA kurulumu eksik. Lutfen web panelden 2FA ayarlayin.' },
                { status: 403 }
            );
        }

        // Client login — requires password
        if (!password || !account.passwordHash) {
            return NextResponse.json(
                { success: false, error: INVALID_CREDENTIALS_MSG },
                { status: 401 }
            );
        }

        const isValidPassword = await bcrypt.compare(password, account.passwordHash);
        if (!isValidPassword) {
            return NextResponse.json(
                { success: false, error: INVALID_CREDENTIALS_MSG },
                { status: 401 }
            );
        }

        const tokens = await createMobileSession(
            account._id!.toString(),
            account.email,
            'client'
        );

        return NextResponse.json({
            success: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: 15 * 60,
            role: 'client',
            account: {
                id: account._id!.toString(),
                name: account.name,
                email: account.email,
                company: account.company,
                username: account.username,
            },
        });

    } catch (error) {
        console.error('Mobile auth error:', error);
        return NextResponse.json(
            { success: false, error: 'Giriş işlemi başarısız' },
            { status: 500 }
        );
    }
}

// PUT /api/mobile/auth - Refresh Token
export async function PUT(request: NextRequest): Promise<NextResponse<TokenResponse>> {
    try {
        const ip = getClientIP(request);

        // Rate limiting for refresh attempts
        const rateCheck = await checkRateLimit(ip, '/api/mobile/auth/refresh', 'auth');
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { success: false, error: 'Çok fazla istek. Lütfen bekleyin.' },
                { status: 429 }
            );
        }

        // Use DB-backed refresh
        const result = await refreshMobileSession();

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            accessToken: result.accessToken,
            expiresIn: 15 * 60,
            role: result.role || undefined,
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json(
            { success: false, error: 'Token yenileme başarısız' },
            { status: 500 }
        );
    }
}

// DELETE /api/mobile/auth - Logout
export async function DELETE(): Promise<NextResponse> {
    try {
        // Destroy session from DB + clear cookies
        await destroyMobileSession();

        return NextResponse.json({
            success: true,
            message: 'Çıkış yapıldı',
        });

    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { success: false, error: 'Çıkış işlemi başarısız' },
            { status: 500 }
        );
    }
}

// OPTIONS /api/mobile/auth - Handle CORS
export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    return response;
}
