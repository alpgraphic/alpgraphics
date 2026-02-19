import { NextRequest, NextResponse } from 'next/server';

// Health check - no auth, no DB - confirms server responds with JSON
export async function GET(request: NextRequest) {
    return NextResponse.json({
        ok: true,
        time: new Date().toISOString(),
        origin: request.headers.get('origin') || 'none',
        userAgent: (request.headers.get('user-agent') || 'none').slice(0, 80),
    });
}

export async function POST(request: NextRequest) {
    return NextResponse.json({
        ok: true,
        method: 'POST',
        time: new Date().toISOString(),
        origin: request.headers.get('origin') || 'none',
        userAgent: (request.headers.get('user-agent') || 'none').slice(0, 80),
    });
}
