import { NextRequest, NextResponse } from 'next/server';
import { getAccountsCollection } from '@/lib/mongodb';
import { authenticator } from '@otplib/preset-default';
import { createMobileSession } from '@/lib/auth/mobileSession';
import { checkRateLimit, getClientIP } from '@/lib/security/rateLimit';
import { ObjectId } from 'mongodb';

// POST /api/mobile/auth/verify-2fa - Verify 2FA code for admin mobile login
export async function POST(request: NextRequest) {
    try {
        const ip = getClientIP(request);

        // Rate limiting for 2FA attempts (strict)
        const rateCheck = await checkRateLimit(ip, '/api/mobile/auth/verify-2fa', 'auth');
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { success: false, error: 'Cok fazla deneme. Lutfen bekleyin.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { adminId, code } = body;

        if (!adminId || !code) {
            return NextResponse.json(
                { success: false, error: 'Admin ID ve dogrulama kodu gereklidir' },
                { status: 400 }
            );
        }

        // Validate adminId format
        if (!ObjectId.isValid(adminId)) {
            return NextResponse.json(
                { success: false, error: 'Gecersiz admin ID' },
                { status: 400 }
            );
        }

        // Validate code format (6 digits)
        const codeStr = String(code).trim();
        if (!/^\d{6}$/.test(codeStr)) {
            return NextResponse.json(
                { success: false, error: 'Kod 6 haneli olmalidir' },
                { status: 400 }
            );
        }

        const accounts = await getAccountsCollection();
        const admin = await accounts.findOne({
            _id: new ObjectId(adminId),
            role: 'admin'
        } as any);

        if (!admin || !admin.twoFactorSecret) {
            return NextResponse.json(
                { success: false, error: 'Dogrulama basarisiz' },
                { status: 401 }
            );
        }

        // Verify TOTP with window for time drift
        try {
            authenticator.options = { window: 2 };
            const isValid = authenticator.verify({
                token: codeStr,
                secret: admin.twoFactorSecret,
            });

            if (!isValid) {
                return NextResponse.json(
                    { success: false, error: 'Gecersiz kod. Tekrar deneyin.' },
                    { status: 401 }
                );
            }
        } catch {
            return NextResponse.json(
                { success: false, error: 'Dogrulama hatasi' },
                { status: 401 }
            );
        }

        // 2FA verified — create mobile session
        const tokens = await createMobileSession(
            admin._id!.toString(),
            admin.email,
            'admin'
        );

        return NextResponse.json({
            success: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: 15 * 60,
            role: 'admin',
            account: {
                id: admin._id!.toString(),
                name: admin.name,
                email: admin.email,
                company: admin.company || 'alpgraphics',
            },
        });

    } catch (error) {
        console.error('Mobile 2FA verify error:', error);
        return NextResponse.json(
            { success: false, error: 'Dogrulama basarisiz' },
            { status: 500 }
        );
    }
}
