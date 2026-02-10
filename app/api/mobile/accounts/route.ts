import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAccountsCollection } from '@/lib/mongodb';

// GET /api/mobile/accounts - Get current user's account only
export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const clientId = cookieStore.get('mobile_client_id')?.value;

        // SECURITY: Must have client ID to access
        if (!clientId) {
            return NextResponse.json(
                { success: false, error: 'Yetkilendirme gerekli' },
                { status: 401 }
            );
        }

        const accounts = await getAccountsCollection();
        const { ObjectId } = await import('mongodb');
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const account = await accounts.findOne({ _id: new ObjectId(clientId) } as any);

        if (!account) {
            return NextResponse.json(
                { success: false, error: 'Hesap bulunamadı' },
                { status: 404 }
            );
        }

        // Return only the client's own account data
        return NextResponse.json({
            success: true,
            data: {
                id: account._id?.toString(),
                name: account.name,
                company: account.company,
                email: account.email,
                balance: account.balance,
                totalDebt: account.totalDebt,
                totalPaid: account.totalPaid,
                briefStatus: account.briefStatus,
                briefFormType: account.briefFormType,
                createdAt: account.createdAt,
            }
        });

    } catch (error) {
        console.error('Get accounts error:', error);
        return NextResponse.json(
            { success: false, error: 'Hesap bilgisi alınamadı' },
            { status: 500 }
        );
    }
}

// PUT /api/mobile/accounts - Update current user's account
export async function PUT(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const clientId = cookieStore.get('mobile_client_id')?.value;

        if (!clientId) {
            return NextResponse.json(
                { success: false, error: 'Yetkilendirme gerekli' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, company } = body;

        const accounts = await getAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await accounts.updateOne(
            { _id: new ObjectId(clientId) } as any,
            {
                $set: {
                    ...(name && { name }),
                    ...(company && { company }),
                    updatedAt: new Date(),
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Hesap bulunamadı' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Hesap güncellendi',
        });

    } catch (error) {
        console.error('Update account error:', error);
        return NextResponse.json(
            { success: false, error: 'Hesap güncellenemedi' },
            { status: 500 }
        );
    }
}
