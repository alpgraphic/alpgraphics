import { NextResponse } from 'next/server';
import { setCSRFToken, getCSRFToken } from '@/lib/security/csrf';

/**
 * GET /api/csrf - Get or create CSRF token
 * Frontend should call this on page load and include the token in subsequent requests
 */
export async function GET() {
    try {
        // Check if token already exists
        let token = await getCSRFToken();
        
        // Generate new token if none exists
        if (!token) {
            token = await setCSRFToken();
        }

        // Return token for frontend to use in headers
        const response = NextResponse.json({ 
            success: true,
            csrfToken: token 
        });

        // Also set it as a client-readable cookie
        response.cookies.set('csrf_token_client', token, {
            httpOnly: false, // JavaScript can read this
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60, // 1 hour
        });

        return response;

    } catch (error) {
        console.error('CSRF token error:', error);
        return NextResponse.json(
            { error: 'CSRF token oluşturulamadı' },
            { status: 500 }
        );
    }
}
