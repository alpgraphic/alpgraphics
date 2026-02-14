import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAccountsCollection, getTransactionsCollection, getSessionsCollection, DbAccount } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth/session';
import { generateBriefToken } from '@/lib/briefTypes';
import { validatePassword } from '@/lib/security/password';

// GET - List all accounts (Admin only)
export async function GET() {
    try {
        // Auth check
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const accounts = await getAccountsCollection();

        const allAccounts = await accounts.find({}).toArray();
        const transactionCollection = await import('@/lib/mongodb').then(m => m.getTransactionsCollection());
        const allTransactions = await transactionCollection.find({}).toArray();

        // Remove sensitive data & Attach Transactions
        const safeAccounts = allAccounts.map(acc => {
            const accountTransactions = allTransactions
                .filter(t => t.accountId === acc._id.toString())
                .map(t => ({
                    id: t._id.toString(),
                    accountId: t.accountId,
                    type: t.type,
                    amount: t.amount,
                    description: t.description,
                    date: t.date.toISOString(),
                }));

            return {
                id: acc._id?.toString(),
                name: acc.name,
                company: acc.company,
                email: acc.email,
                totalDebt: acc.totalDebt,
                totalPaid: acc.totalPaid,
                balance: acc.balance,
                status: acc.status,
                briefFormType: acc.briefFormType,
                briefStatus: acc.briefStatus,
                briefToken: acc.briefToken, // Token for brief form URL
                briefResponses: acc.briefResponses,
                briefSubmittedAt: acc.briefSubmittedAt,
                createdAt: acc.createdAt,
                transactions: accountTransactions
            };
        });

        return NextResponse.json({ accounts: safeAccounts });
    } catch (error) {
        console.error('Get accounts error:', error);
        return NextResponse.json(
            { error: 'Hesaplar alınamadı' },
            { status: 500 }
        );
    }
}

// POST - Create new account (Admin only)
export async function POST(request: NextRequest) {
    try {
        // Auth check
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await request.json();
        const { name, company, email, password, briefFormType } = body;

        if (!name || !company || !email || !password) {
            return NextResponse.json(
                { error: 'Tüm alanlar gereklidir' },
                { status: 400 }
            );
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

        const accounts = await getAccountsCollection();

        // Check if email exists (safe exact match)
        const existing = await accounts.findOne({
            email: email.toLowerCase().trim()
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Bu e-posta adresi zaten kullanımda' },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Generate brief token for client brief form access
        const briefToken = generateBriefToken();

        const newAccount: DbAccount = {
            name,
            company,
            email: email.toLowerCase(),
            passwordHash,
            briefToken, // Unique token for brief form URL
            totalDebt: 0,
            totalPaid: 0,
            balance: 0,
            status: 'Active',
            briefFormType: briefFormType === 'none' ? undefined : briefFormType,
            briefStatus: briefFormType && briefFormType !== 'none' ? 'pending' : 'none',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await accounts.insertOne(newAccount);

        return NextResponse.json({
            success: true,
            account: {
                id: result.insertedId.toString(),
                name,
                company,
                email: email.toLowerCase(),
                briefFormType: newAccount.briefFormType,
                briefStatus: newAccount.briefStatus,
                briefToken: briefToken, // Return token for admin to share
            }
        });

    } catch (error) {
        console.error('Create account error:', error);
        return NextResponse.json(
            { error: 'Hesap oluşturulamadı' },
            { status: 500 }
        );
    }
}

// DELETE - Delete account (Admin only)
export async function DELETE(request: NextRequest) {
    try {
        // Auth check
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Hesap ID gerekli' },
                { status: 400 }
            );
        }

        const accounts = await getAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await accounts.deleteOne({ _id: new ObjectId(id) } as any);

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Hesap bulunamadı' },
                { status: 404 }
            );
        }

        // Cascade: clean up related data
        const transactions = await getTransactionsCollection();
        const sessions = await getSessionsCollection();
        await Promise.all([
            transactions.deleteMany({ accountId: id }),
            sessions.deleteMany({ userId: id }),
        ]);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Delete account error:', error);
        return NextResponse.json(
            { error: 'Hesap silinemedi' },
            { status: 500 }
        );
    }
}

// PUT - Update account (Admin only)
export async function PUT(request: NextRequest) {
    try {
        // Auth check
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Hesap ID gerekli' },
                { status: 400 }
            );
        }

        const accounts = await getAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // SECURITY: Only allow whitelisted fields to be updated
        const ALLOWED_FIELDS = [
            'name', 'company', 'email', 'status',
            'briefFormType', 'briefStatus', 'briefResponses',
            'briefSubmittedAt', 'briefApprovedAt',
            'totalDebt', 'totalPaid', 'balance'
        ];

        const safeUpdates: Record<string, any> = { updatedAt: new Date() };
        for (const key of ALLOWED_FIELDS) {
            if (body[key] !== undefined) {
                safeUpdates[key] = body[key];
            }
        }

        // If email is being updated, normalize it
        if (safeUpdates.email) {
            safeUpdates.email = String(safeUpdates.email).toLowerCase().trim();
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await accounts.updateOne(
            { _id: new ObjectId(id) } as any,
            { $set: safeUpdates }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Hesap bulunamadı' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Update account error:', error);
        return NextResponse.json(
            { error: 'Hesap güncellenemedi' },
            { status: 500 }
        );
    }
}
