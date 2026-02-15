import { NextRequest, NextResponse } from 'next/server';
import { getTransactionsCollection, getAccountsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/auth/session';

// GET transactions (Admin only)
export async function GET(request: NextRequest) {
    try {
        // Auth check
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId');

        const collection = await getTransactionsCollection();
        const query = accountId ? { accountId } : {};

        const transactions = await collection.find(query).sort({ date: -1 }).toArray();

        // Convert _id to string
        const safeTransactions = transactions.map(t => ({
            ...t,
            id: t._id.toString(),
            _id: undefined
        }));

        return NextResponse.json({ transactions: safeTransactions });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

// POST new transaction (Admin only)
export async function POST(request: NextRequest) {
    try {
        // Auth check
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await request.json();
        const { accountId, type, amount, description, date } = body;

        if (!accountId || !type || amount === undefined || amount === null) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Validate amount is a valid number
        const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json({ error: 'Gecersiz tutar' }, { status: 400 });
        }

        // Validate type
        if (!['Debt', 'Payment'].includes(type)) {
            return NextResponse.json({ error: 'Gecersiz islem tipi (Debt veya Payment)' }, { status: 400 });
        }

        // Validate date
        const parsedDate = date ? new Date(date) : new Date();
        if (isNaN(parsedDate.getTime())) {
            return NextResponse.json({ error: 'Gecersiz tarih' }, { status: 400 });
        }

        // Validate accountId is a valid ObjectId
        if (!ObjectId.isValid(accountId)) {
            return NextResponse.json({ error: 'Gecersiz hesap ID' }, { status: 400 });
        }

        const transactions = await getTransactionsCollection();
        const accounts = await getAccountsCollection();

        // Verify account exists
        const account = await accounts.findOne({ _id: new ObjectId(accountId) } as any);
        if (!account) {
            return NextResponse.json({ error: 'Hesap bulunamadi' }, { status: 404 });
        }

        // 1. Create Transaction
        const newTransaction = {
            accountId,
            type,
            amount: parsedAmount,
            description: description || '',
            date: parsedDate,
            createdAt: new Date()
        };

        const result = await transactions.insertOne(newTransaction);

        // 2. Update Account Balance
        const accountObjectId = new ObjectId(accountId);

        const updateDoc: any = { $set: { updatedAt: new Date() } };

        if (type === 'Debt') {
            updateDoc.$inc = { totalDebt: parsedAmount, balance: parsedAmount };
        } else if (type === 'Payment') {
            updateDoc.$inc = { totalPaid: parsedAmount, balance: -parsedAmount };
        }

        await accounts.updateOne(
            { _id: accountObjectId as any },
            updateDoc
        );

        return NextResponse.json({
            success: true,
            transaction: { ...newTransaction, id: result.insertedId.toString() }
        });

    } catch (error) {
        console.error('Transaction error:', error);
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}
