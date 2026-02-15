import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAccountsCollection } from '@/lib/mongodb';
import { createSession } from '@/lib/auth/session';
import { checkRateLimit, getClientIP } from '@/lib/security/rateLimit';

// Generic error message to prevent user enumeration
const INVALID_CREDENTIALS_MSG = 'E-posta veya şifre hatalı';

export async function POST(request: NextRequest) {
    try {
        // Get client IP for rate limiting
        const ip = getClientIP(request);
        
        // Rate limiting for auth endpoints (10 attempts per 15 minutes)
        const rateCheck = await checkRateLimit(ip, '/api/auth/login', 'auth');
        
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { 
                    error: 'Çok fazla giriş denemesi. Lütfen 15 dakika bekleyin.',
                    retryAfter: Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000)
                },
                { 
                    status: 429,
                    headers: {
                        'Retry-After': String(Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000))
                    }
                }
            );
        }

        const body = await request.json();
        const { email, password, role } = body;

        if (!email || !password || !role) {
            return NextResponse.json({ error: 'Email, password ve role gereklidir' }, { status: 400 });
        }

        // Validate role against whitelist
        if (!['admin', 'client'].includes(role)) {
            return NextResponse.json({ error: INVALID_CREDENTIALS_MSG }, { status: 401 });
        }

        // Validate email format to prevent injection
        const emailStr = String(email).toLowerCase().trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
            return NextResponse.json({ error: INVALID_CREDENTIALS_MSG }, { status: 401 });
        }

        const accounts = await getAccountsCollection();
        
        // SAFE: Use exact match with lowercased email (no regex)
        let query: any = { email: emailStr };
        
        if (role === 'admin') {
            query.role = 'admin';
        } else {
            query.$or = [
                { role: 'client' },
                { role: { $exists: false } },
                { role: null }
            ];
        }
        
        const user = await accounts.findOne(query);

        if (!user) {
            // Timing-safe: still do a bcrypt compare to prevent timing attacks
            await bcrypt.compare(password, '$2a$12$invalidhashpaddingtomakeitsamelengthasbcrypt');
            return NextResponse.json({ error: INVALID_CREDENTIALS_MSG }, { status: 401 });
        }

        // Only allow bcrypt hashed passwords — no plain text
        if (!user.passwordHash) {
            return NextResponse.json({ error: INVALID_CREDENTIALS_MSG }, { status: 401 });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
            return NextResponse.json({ error: INVALID_CREDENTIALS_MSG }, { status: 401 });
        }

        // Get request metadata for session
        const userAgent = request.headers.get('user-agent') || undefined;

        // 2FA Flow for Admins
        if (role === 'admin') {
            if (user.twoFactorSecret) {
                return NextResponse.json({
                    success: true,
                    requires2FA: true,
                    // Don't return email back — client already has it
                });
            } else {
                return NextResponse.json({ 
                    error: '2FA kurulumu eksik. Lütfen yönetici ile iletişime geçin.' 
                }, { status: 403 });
            }
        }

        // Client Login - Create session in database
        await createSession(
            user._id!.toString(),
            user.email,
            'client',
            ip,
            userAgent
        );

        return NextResponse.json({
            success: true,
            role: 'client',
            account: {
                id: user._id?.toString(),
                name: user.name,
                email: user.email,
                company: user.company,
            },
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Giriş işlemi başarısız' }, { status: 500 });
    }
}
