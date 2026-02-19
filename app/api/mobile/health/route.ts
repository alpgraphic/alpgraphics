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

// OPTIONS Handle CORS
export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    return response;
}
