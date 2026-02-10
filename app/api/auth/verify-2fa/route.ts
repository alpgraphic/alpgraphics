import { NextRequest, NextResponse } from 'next/server';
import { getAccountsCollection } from '@/lib/mongodb';
import { authenticator } from '@otplib/preset-default';
import { createSession } from '@/lib/auth/session';
import { checkRateLimit, getClientIP } from '@/lib/security/rateLimit';

export async function POST(request: NextRequest) {
    try {
        // Get client IP for rate limiting
        const ip = getClientIP(request);
        
        // Rate limiting for 2FA attempts
        const rateCheck = await checkRateLimit(ip, '/api/auth/verify-2fa', 'auth');
        
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { 
                    error: 'Çok fazla deneme. Lütfen bekleyin.',
                    retryAfter: Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000)
                },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { email, token } = body;

        if (!email || !token) {
            return NextResponse.json({ error: 'Email ve kod gereklidir' }, { status: 400 });
        }

        const accounts = await getAccountsCollection();
        const emailStr = String(email).toLowerCase().trim();
        const user = await accounts.findOne({ email: emailStr, role: 'admin' });

        if (!user || !user.twoFactorSecret) {
            return NextResponse.json({ error: 'Doğrulama başarısız' }, { status: 401 });
        }

        // Verify TOTP with window for time drift
        try {
            authenticator.options = { window: 2 };
            const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });
            if (!isValid) {
                return NextResponse.json({ error: 'Geçersiz kod' }, { status: 401 });
            }
        } catch (err) {
            return NextResponse.json({ error: 'Doğrulama hatası' }, { status: 401 });
        }

        // Get request metadata
        const userAgent = request.headers.get('user-agent') || undefined;

        // Create session in database
        await createSession(
            user._id!.toString(),
            user.email,
            'admin',
            ip,
            userAgent
        );

        return NextResponse.json({
            success: true,
            role: 'admin',
        });

    } catch (error) {
        console.error('2FA Verify error:', error);
        return NextResponse.json({ error: 'Doğrulama başarısız' }, { status: 500 });
    }
}
