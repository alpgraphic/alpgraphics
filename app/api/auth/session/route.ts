import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';

export async function GET() {
    try {
        // Verify session against database (not just cookie existence)
        const session = await verifySession();

        if (!session.authenticated) {
            return NextResponse.json({
                authenticated: false,
                role: null,
            });
        }

        return NextResponse.json({
            authenticated: true,
            role: session.role,
            userId: session.userId,
        });

    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json(
            { error: 'Session kontrolü başarısız' },
            { status: 500 }
        );
    }
}
