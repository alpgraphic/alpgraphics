import { NextRequest, NextResponse } from 'next/server';
import { getProposalsCollection } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth/session';
import { ObjectId } from 'mongodb';

// GET - List all proposals (Admin only)
export async function GET() {
    try {
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const collection = await getProposalsCollection();
        const proposals = await collection.find({}).sort({ createdAt: -1 }).toArray();

        return NextResponse.json({ proposals });
    } catch (error) {
        console.error('Get proposals error:', error);
        return NextResponse.json(
            { error: 'Teklifler alınamadı' },
            { status: 500 }
        );
    }
}

// POST - Create new proposal (Admin only)
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await request.json();
        const collection = await getProposalsCollection();

        // SECURITY: Only allow whitelisted fields
        const ALLOWED_FIELDS = [
            'id', 'title', 'clientName', 'date', 'validUntil', 'items',
            'totalAmount', 'status', 'currency', 'currencySymbol', 'taxRate',
            'logoText', 'logoSubtext', 'logoUrl', 'primaryColor', 'attnText',
            'preparedForLabel', 'projectLabel', 'footerName', 'footerTitle',
            'footerNote', 'website', 'phone', 'email', 'address', 'notes',
            'accountId',
        ];

        const safeProposal: Record<string, any> = {
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        for (const key of ALLOWED_FIELDS) {
            if (body[key] !== undefined) {
                safeProposal[key] = body[key];
            }
        }

        const result = await collection.insertOne(safeProposal as any);

        return NextResponse.json({
            success: true,
            proposal: { ...safeProposal, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Create proposal error:', error);
        return NextResponse.json(
            { error: 'Teklif oluşturulamadı' },
            { status: 500 }
        );
    }
}

// PUT - Update proposal (Admin only)
export async function PUT(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'Proposal ID gerekli' }, { status: 400 });
        }

        const collection = await getProposalsCollection();

        // SECURITY: Only allow whitelisted fields
        const ALLOWED_UPDATE_FIELDS = [
            'title', 'clientName', 'date', 'validUntil', 'items',
            'totalAmount', 'status', 'currency', 'currencySymbol', 'taxRate',
            'logoText', 'logoSubtext', 'logoUrl', 'primaryColor', 'attnText',
            'preparedForLabel', 'projectLabel', 'footerName', 'footerTitle',
            'footerNote', 'website', 'phone', 'email', 'address', 'notes',
            'accountId',
        ];

        const safeUpdates: Record<string, any> = { updatedAt: new Date() };
        for (const key of ALLOWED_UPDATE_FIELDS) {
            if (body[key] !== undefined) {
                safeUpdates[key] = body[key];
            }
        }

        // Try ObjectId first, then numeric id
        let result;
        if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
            result = await collection.updateOne(
                { _id: new ObjectId(id) } as any,
                { $set: safeUpdates }
            );
        }
        if (!result || result.matchedCount === 0) {
            const numericId = typeof id === 'number' ? id : parseInt(id, 10);
            if (!isNaN(numericId)) {
                result = await collection.updateOne(
                    { id: numericId },
                    { $set: safeUpdates }
                );
            }
        }

        if (!result || result.matchedCount === 0) {
            return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update proposal error:', error);
        return NextResponse.json(
            { error: 'Teklif güncellenemedi' },
            { status: 500 }
        );
    }
}

// DELETE - Delete proposal (Admin only)
export async function DELETE(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Proposal ID gerekli' }, { status: 400 });
        }

        const collection = await getProposalsCollection();

        let result;

        // Try MongoDB ObjectId first
        if (ObjectId.isValid(id)) {
            result = await collection.deleteOne({ _id: new ObjectId(id) } as any);
        }

        // If not found, try numeric ID
        if (!result || result.deletedCount === 0) {
            const numericId = parseInt(id, 10);
            if (!isNaN(numericId)) {
                result = await collection.deleteOne({ id: numericId });
            }
        }

        if (!result || result.deletedCount === 0) {
            return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete proposal error:', error);
        return NextResponse.json(
            { error: 'Teklif silinemedi' },
            { status: 500 }
        );
    }
}
