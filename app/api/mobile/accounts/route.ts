import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAccountsCollection, DbAccount } from '@/lib/mongodb';
import { rateLimitMiddleware } from '@/lib/security/rateLimit';
import { verifyMobileSession } from '@/lib/auth/mobileSession';
import { generateBriefToken } from '@/lib/briefTypes';
import { validatePassword } from '@/lib/security/password';

// GET /api/mobile/accounts - Get accounts (admin: all, client: own)
export async function GET(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        // DB-backed session verification
        const session = await verifyMobileSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Yetkilendirme gerekli' },
                { status: 401 }
            );
        }

        const { userId: clientId, role } = session;

        const accounts = await getAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // Admin: return all client accounts (including those without role field)
        if (role === 'admin') {
            const allAccounts = await accounts
                .find({ $or: [{ role: { $ne: 'admin' } }, { role: { $exists: false } }] })
                .sort({ createdAt: -1 })
                .toArray();

            return NextResponse.json({
                success: true,
                data: allAccounts.map(acc => ({
                    id: acc._id?.toString(),
                    name: acc.name,
                    company: acc.company,
                    email: acc.email,
                    username: acc.username,
                    balance: acc.balance || 0,
                    totalDebt: acc.totalDebt || 0,
                    totalPaid: acc.totalPaid || 0,
                    briefStatus: acc.briefStatus,
                    briefFormType: acc.briefFormType,
                    briefResponses: acc.briefResponses || null,
                    briefSubmittedAt: acc.briefSubmittedAt || null,
                    briefApprovedAt: acc.briefApprovedAt || null,
                    createdAt: acc.createdAt,
                })),
            });
        }

        // Client: return own account only

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const account = await accounts.findOne({ _id: new ObjectId(clientId) } as any);

        if (!account) {
            return NextResponse.json(
                { success: false, error: 'Hesap bulunamadı' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: account._id?.toString(),
                name: account.name,
                company: account.company,
                email: account.email,
                balance: account.balance || 0,
                totalDebt: account.totalDebt || 0,
                totalPaid: account.totalPaid || 0,
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

// PUT /api/mobile/accounts - Update account (client: self only, admin: any account)
export async function PUT(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        const session = await verifyMobileSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Yetkilendirme gerekli' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, company, accountId, briefStatus, briefApprovedAt, username, password } = body;

        const accounts = await getAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // Admin can target any account, client can only update self
        const targetId = (session.role === 'admin' && accountId) ? accountId : session.userId;

        if (!targetId || !ObjectId.isValid(targetId)) {
            return NextResponse.json(
                { success: false, error: 'Gecersiz hesap ID' },
                { status: 400 }
            );
        }

        // Build update fields
        const updateFields: Record<string, any> = { updatedAt: new Date() };
        if (name) updateFields.name = String(name).trim();
        if (company) updateFields.company = String(company).trim();

        // Admin-only fields
        if (session.role === 'admin') {
            if (briefStatus && ['pending', 'submitted', 'approved', 'none'].includes(briefStatus)) {
                updateFields.briefStatus = briefStatus;
            }
            if (briefApprovedAt) {
                updateFields.briefApprovedAt = new Date(briefApprovedAt);
            }
            if (username) {
                updateFields.username = String(username).toLowerCase().trim();
            }
            if (password) {
                updateFields.passwordHash = await bcrypt.hash(password, 12);
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await accounts.updateOne(
            { _id: new ObjectId(targetId) } as any,
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Hesap bulunamadi' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Hesap guncellendi',
        });

    } catch (error) {
        console.error('Update account error:', error);
        return NextResponse.json(
            { success: false, error: 'Hesap guncellenemedi' },
            { status: 500 }
        );
    }
}

// POST /api/mobile/accounts - Create new client account (admin only)
export async function POST(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        const session = await verifyMobileSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Admin yetkisi gerekli' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, company, email, username, password } = body;

        if (!name || !company || !username) {
            return NextResponse.json(
                { success: false, error: 'Ad, sirket ve kullanici adi zorunludur' },
                { status: 400 }
            );
        }

        const usernameStr = String(username).toLowerCase().trim();
        if (!/^[a-z0-9_.-]{3,30}$/.test(usernameStr)) {
            return NextResponse.json(
                { success: false, error: 'Kullanici adi 3-30 karakter, harf/rakam/._- icerebilir' },
                { status: 400 }
            );
        }

        const emailStr = email ? String(email).toLowerCase().trim() : `${usernameStr}@alpgraphics.local`;

        // Validate password strength if provided
        if (password) {
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                return NextResponse.json(
                    { success: false, error: 'Sifre yeterince guclu degil', details: passwordValidation.errors },
                    { status: 400 }
                );
            }
        }

        const accounts = await getAccountsCollection();

        // Check duplicate username or email
        const existingQuery: any[] = [{ username: usernameStr }];
        if (email) existingQuery.push({ email: emailStr });
        const existing = await accounts.findOne({ $or: existingQuery } as any);
        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Hesap olusturulamadi' },
                { status: 400 }
            );
        }

        const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;
        const briefToken = generateBriefToken();

        const newAccount: DbAccount = {
            name: String(name).trim(),
            company: String(company).trim(),
            email: emailStr,
            username: usernameStr,
            passwordHash,
            briefToken,
            totalDebt: 0,
            totalPaid: 0,
            balance: 0,
            status: 'Active',
            briefStatus: 'none',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await accounts.insertOne(newAccount);

        return NextResponse.json({
            success: true,
            account: {
                id: result.insertedId.toString(),
                name: newAccount.name,
                company: newAccount.company,
                email: newAccount.email,
            },
        });

    } catch (error) {
        console.error('Create account error:', error);
        return NextResponse.json(
            { success: false, error: 'Hesap olusturulamadi' },
            { status: 500 }
        );
    }
}

// OPTIONS Handle CORS
export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    return response;
}
