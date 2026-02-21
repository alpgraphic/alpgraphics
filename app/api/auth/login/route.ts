import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAccountsCollection } from '@/lib/mongodb';
import { createSession } from '@/lib/auth/session';
import { checkRateLimit, getClientIP } from '@/lib/security/rateLimit';

// Generic error message to prevent user enumeration
const INVALID_CREDENTIALS_MSG = 'Kullanıcı adı veya şifre hatalı';

export async function POST(request: NextRequest) {
    try {
        const ip = getClientIP(request);
        const rateCheck = await checkRateLimit(ip, '/api/auth/login', 'auth');

        if (!rateCheck.allowed) {
            return NextResponse.json(
                {
                    error: 'Çok fazla giriş denemesi. Lütfen 15 dakika bekleyin.',
                    retryAfter: Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000)
                },
                {
                    status: 429,
                    headers: { 'Retry-After': String(Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000)) }
                }
            );
        }

        const body = await request.json();
        const { username, password, role } = body;

        if (!username || !role) {
            return NextResponse.json({ error: 'Kullanıcı adı ve rol gereklidir' }, { status: 400 });
        }

        if (!['admin', 'client'].includes(role)) {
            return NextResponse.json({ error: INVALID_CREDENTIALS_MSG }, { status: 401 });
        }

        const usernameStr = String(username).toLowerCase().trim();
        const accounts = await getAccountsCollection();

        // Find by username field or fall back to email (backward compat)
        const userOrQuery = { $or: [{ username: usernameStr }, { email: usernameStr }] };
        let query: any;

        if (role === 'admin') {
            query = { ...userOrQuery, role: 'admin' };
        } else {
            query = {
                $and: [
                    userOrQuery,
                    { $or: [{ role: 'client' }, { role: { $exists: false } }, { role: null }] }
                ]
            };
        }

        const user = await accounts.findOne(query);

        if (!user) {
            if (password) await bcrypt.compare(password, '$2a$12$invalidhashpaddingtomakeitsamelengthasbcrypt');
            return NextResponse.json({ error: INVALID_CREDENTIALS_MSG }, { status: 401 });
        }

        // Admin flow — requires password + 2FA
        if (role === 'admin') {
            if (!password || !user.passwordHash) {
                return NextResponse.json({ error: INVALID_CREDENTIALS_MSG }, { status: 401 });
            }

            const isValidPassword = await bcrypt.compare(password, user.passwordHash);
            if (!isValidPassword) {
                return NextResponse.json({ error: INVALID_CREDENTIALS_MSG }, { status: 401 });
            }

            if (user.twoFactorSecret) {
                return NextResponse.json({ success: true, requires2FA: true });
            } else {
                return NextResponse.json({ error: '2FA kurulumu eksik. Lütfen yönetici ile iletişime geçin.' }, { status: 403 });
            }
        }

        // Client login — requires password
        if (!password || !user.passwordHash) {
            return NextResponse.json({ error: INVALID_CREDENTIALS_MSG }, { status: 401 });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return NextResponse.json({ error: INVALID_CREDENTIALS_MSG }, { status: 401 });
        }

        const userAgent = request.headers.get('user-agent') || undefined;
        await createSession(user._id!.toString(), user.email, 'client', ip, userAgent);

        return NextResponse.json({
            success: true,
            role: 'client',
            account: {
                id: user._id?.toString(),
                name: user.name,
                email: user.email,
                company: user.company,
                username: user.username,
            },
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Giriş işlemi başarısız' }, { status: 500 });
    }
}
