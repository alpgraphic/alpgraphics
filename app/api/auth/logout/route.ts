import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/session';

export async function POST() {
    try {
        // Destroy session in database and clear cookies
        await destroySession();

        return NextResponse.json({
            success: true,
            message: 'Çıkış yapıldı',
        });

    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Çıkış işlemi başarısız' },
            { status: 500 }
        );
    }
}
