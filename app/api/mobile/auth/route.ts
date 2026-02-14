import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';
import { getAccountsCollection } from '@/lib/mongodb';
import { checkRateLimit, getClientIP } from '@/lib/security/rateLimit';

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
    };
    error?: string;
}

// Generic error to prevent user enumeration
const INVALID_CREDENTIALS_MSG = 'E-posta veya şifre hatalı';

// POST /api/mobile/auth - Login
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
        const { email, password, role } = body;

        if (!email || !password || !role) {
            return NextResponse.json(
                { success: false, error: 'Email, password ve role gereklidir' },
                { status: 400 }
            );
        }

        // Validate & sanitize email
        const emailStr = String(email).toLowerCase().trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
            return NextResponse.json(
                { success: false, error: INVALID_CREDENTIALS_MSG },
                { status: 401 }
            );
        }

        const cookieStore = await cookies();
        const accounts = await getAccountsCollection();

        // Admin login
        if (role === 'admin') {
            // SAFE: exact match, no regex
            const admin = await accounts.findOne({ email: emailStr, role: 'admin' });

            if (!admin || !admin.passwordHash) {
                await bcrypt.compare(password, '$2a$12$invalidhashpaddingtomakeitsamelengthasbcrypt');
                return NextResponse.json(
                    { success: false, error: INVALID_CREDENTIALS_MSG },
                    { status: 401 }
                );
            }

            const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
            if (!isValidPassword) {
                return NextResponse.json(
                    { success: false, error: INVALID_CREDENTIALS_MSG },
                    { status: 401 }
                );
            }

            // Admin requires 2FA
            if (admin.twoFactorSecret) {
                return NextResponse.json({
                    success: true,
                    requires2FA: true,
                } as any);
            }

            const accessToken = generateToken();
            const refreshToken = generateToken();

            cookieStore.set('mobile_access_token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60,
                path: '/',
            });

            cookieStore.set('mobile_refresh_token', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60,
                path: '/',
            });

            cookieStore.set('mobile_role', 'admin', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60,
                path: '/',
            });

            return NextResponse.json({
                success: true,
                accessToken,
                refreshToken,
                expiresIn: 15 * 60,
                role: 'admin',
            });
        }

        // Client login
        if (role === 'client') {
            // SAFE: exact match, no regex
            const account = await accounts.findOne({
                email: emailStr,
                $or: [
                    { role: 'client' },
                    { role: { $exists: false } }
                ]
            } as any);

            if (!account || !account.passwordHash) {
                await bcrypt.compare(password, '$2a$12$invalidhashpaddingtomakeitsamelengthasbcrypt');
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

            const accessToken = generateToken();
            const refreshToken = generateToken();

            cookieStore.set('mobile_access_token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60,
                path: '/',
            });

            cookieStore.set('mobile_refresh_token', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60,
                path: '/',
            });

            cookieStore.set('mobile_client_id', account._id!.toString(), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60,
                path: '/',
            });

            cookieStore.set('mobile_role', 'client', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60,
                path: '/',
            });

            return NextResponse.json({
                success: true,
                accessToken,
                refreshToken,
                expiresIn: 15 * 60,
                role: 'client',
                account: {
                    id: account._id!.toString(),
                    name: account.name,
                    email: account.email,
                    company: account.company,
                },
            });
        }

        return NextResponse.json(
            { success: false, error: 'Geçersiz rol' },
            { status: 400 }
        );

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

        // Verify refresh token from httpOnly cookie (not from request body)
        const cookieStore = await cookies();
        const storedRefreshToken = cookieStore.get('mobile_refresh_token')?.value;
        const storedRole = cookieStore.get('mobile_role')?.value;

        if (!storedRefreshToken) {
            return NextResponse.json(
                { success: false, error: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.' },
                { status: 401 }
            );
        }

        // Validate token format
        if (storedRefreshToken.length < 32) {
            return NextResponse.json(
                { success: false, error: 'Geçersiz token. Lütfen tekrar giriş yapın.' },
                { status: 401 }
            );
        }

        // Generate new access token
        const newAccessToken = generateToken();

        // Update access token cookie
        cookieStore.set('mobile_access_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60,
            path: '/',
        });

        return NextResponse.json({
            success: true,
            accessToken: newAccessToken,
            expiresIn: 15 * 60,
            role: storedRole || undefined,
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
        const cookieStore = await cookies();
        cookieStore.delete('mobile_access_token');
        cookieStore.delete('mobile_refresh_token');
        cookieStore.delete('mobile_client_id');
        cookieStore.delete('mobile_role');

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
