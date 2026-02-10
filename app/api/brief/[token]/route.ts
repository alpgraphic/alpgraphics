import { NextRequest, NextResponse } from 'next/server';
import { getAccountsCollection } from '@/lib/mongodb';
import { checkRateLimit, getClientIP } from '@/lib/security/rateLimit';

// GET /api/brief/[token] - Get brief form data by token (public access for clients)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        if (!token || typeof token !== 'string' || token.length < 10) {
            return NextResponse.json({ error: 'Geçersiz token' }, { status: 400 });
        }

        // Rate limit public endpoint
        const ip = getClientIP(request);
        const rateCheck = await checkRateLimit(ip, '/api/brief/get', 'api');
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: 'Çok fazla istek. Lütfen bekleyin.' },
                { status: 429 }
            );
        }

        const accounts = await getAccountsCollection();

        // Find account by briefToken
        const account = await accounts.findOne({ briefToken: token });

        if (!account) {
            return NextResponse.json({ 
                success: false, 
                error: 'Brief formu bulunamadı veya süresi dolmuş' 
            }, { status: 404 });
        }

        // Check if already submitted
        if (account.briefStatus === 'submitted' || account.briefStatus === 'approved') {
            return NextResponse.json({ 
                success: false, 
                error: 'Bu brief formu zaten gönderilmiş' 
            }, { status: 400 });
        }

        // Check if form type is assigned
        if (!account.briefFormType || account.briefFormType === 'none') {
            return NextResponse.json({ 
                success: false, 
                error: 'Bu hesaba henüz form atanmamış' 
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            data: {
                accountId: account._id.toString(),
                formType: account.briefFormType,
                accountName: account.name,
                accountCompany: account.company,
            }
        });

    } catch (error) {
        console.error('Get brief error:', error);
        return NextResponse.json({ error: 'Brief alınamadı' }, { status: 500 });
    }
}

// POST /api/brief/[token] - Submit brief responses (public access for clients)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        if (!token || typeof token !== 'string' || token.length < 10) {
            return NextResponse.json({ error: 'Geçersiz token' }, { status: 400 });
        }

        // Rate limit submissions more strictly
        const ip = getClientIP(request);
        const rateCheck = await checkRateLimit(ip, '/api/brief/submit', 'heavy');
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: 'Çok fazla istek. Lütfen bekleyin.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { responses } = body;

        if (!responses || typeof responses !== 'object') {
            return NextResponse.json({ error: 'Cevaplar gerekli' }, { status: 400 });
        }

        const accounts = await getAccountsCollection();

        // Find and update account
        const result = await accounts.findOneAndUpdate(
            { 
                briefToken: token,
                briefStatus: 'pending' // Only allow submission if pending
            },
            {
                $set: {
                    briefResponses: responses,
                    briefStatus: 'submitted',
                    briefSubmittedAt: new Date(),
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

        if (!result) {
            return NextResponse.json({ 
                success: false, 
                error: 'Brief formu bulunamadı veya zaten gönderilmiş' 
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Brief başarıyla gönderildi'
        });

    } catch (error) {
        console.error('Submit brief error:', error);
        return NextResponse.json({ error: 'Brief gönderilemedi' }, { status: 500 });
    }
}
