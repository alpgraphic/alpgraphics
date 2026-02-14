import { NextRequest, NextResponse } from 'next/server';
import { getAccountsCollection } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { authenticator } from '@otplib/preset-default';
import QRCode from 'qrcode';
import { validatePassword } from '@/lib/security/password';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, step, secret, token } = body;

        const accounts = await getAccountsCollection();

        // SECURITY: Check if ANY admin exists
        const existingAdmin = await accounts.findOne({ role: 'admin' });

        // STEP 1: Initialize Setup - Generate 2FA Secret
        if (step === 'init') {
            // Block if admin already exists
            if (existingAdmin) {
                return NextResponse.json({
                    error: 'Admin zaten mevcut. Yeni admin oluşturmak için mevcut admin ile iletişime geçin.'
                }, { status: 403 });
            }

            const newSecret = authenticator.generateSecret();
            const otpauth = authenticator.keyuri(email || 'admin@alpgraphics', 'Alpgraphics Admin', newSecret);
            const qrCodeUrl = await QRCode.toDataURL(otpauth);

            return NextResponse.json({
                success: true,
                secret: newSecret,
                qrCodeUrl
            });
        }

        // STEP 2: Verify & Create Admin
        if (step === 'verify') {
            // Block if admin already exists (double check)
            if (existingAdmin) {
                return NextResponse.json({
                    error: 'Admin zaten mevcut. Bu endpoint artık kullanılamaz.'
                }, { status: 403 });
            }

            if (!email || !password || !secret || !token) {
                return NextResponse.json({ error: 'Eksik alanlar var' }, { status: 400 });
            }

            // Validate password strength
            const passwordValidation = validatePassword(password, email);
            if (!passwordValidation.valid) {
                return NextResponse.json(
                    {
                        error: 'Şifre gereksinimleri karşılanmıyor',
                        details: passwordValidation.errors,
                        suggestions: passwordValidation.suggestions
                    },
                    { status: 400 }
                );
            }

            // Verify TOTP
            try {
                // Allow 2 steps of window (approx ±60 seconds) for time drift
                authenticator.options = { window: 2 };

                const isValid = authenticator.verify({ token, secret });

                if (!isValid) {
                    return NextResponse.json({ error: 'Geçersiz 2FA kodu' }, { status: 400 });
                }
            } catch (err) {
                return NextResponse.json({ error: 'Geçersiz 2FA Secret' }, { status: 400 });
            }

            // Hash Password with higher cost factor for admin
            const passwordHash = await bcrypt.hash(password, 12);

            // Create Admin atomically to prevent race condition
            const newAdmin = {
                email: email.toLowerCase(),
                passwordHash,
                role: 'admin' as const,
                twoFactorSecret: secret,
                createdAt: new Date(),
                name: 'System Admin',
                company: 'Alpgraphics',
                status: 'Active' as const,
                totalDebt: 0,
                totalPaid: 0,
                balance: 0,
                briefFormType: 'none',
                briefStatus: 'none' as const,
                updatedAt: new Date()
            };

            // Atomic: only insert if no admin exists (prevents two concurrent setups)
            const result = await accounts.findOneAndUpdate(
                { role: 'admin' },
                { $setOnInsert: newAdmin },
                { upsert: true, returnDocument: 'after' }
            );

            // If the returned doc has a different email, another admin was created first
            if (result && result.email !== email.toLowerCase()) {
                return NextResponse.json({
                    error: 'Başka bir admin zaten oluşturulmuş.'
                }, { status: 403 });
            }

            return NextResponse.json({ success: true, message: 'Admin başarıyla oluşturuldu' });
        }

        return NextResponse.json({ error: 'Geçersiz adım' }, { status: 400 });

    } catch (error) {
        console.error('Setup error:', error);
        return NextResponse.json({ error: 'Setup başarısız' }, { status: 500 });
    }
}
