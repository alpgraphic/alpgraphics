/**
 * Upload API Routes
 * Handles file upload and deletion for Vercel Blob Storage
 * Note: @vercel/blob package is optional - falls back gracefully
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';

// Dynamic import to handle missing @vercel/blob package
let vercelBlobDel: ((url: string) => Promise<void>) | null = null;
try {
    const vercelBlob = require('@vercel/blob');
    vercelBlobDel = vercelBlob.del;
} catch {
    console.warn('⚠️ @vercel/blob not installed, delete endpoint disabled');
}

/**
 * DELETE /api/upload/delete
 * Delete a file from Vercel Blob Storage (Admin only)
 */
export async function DELETE(request: NextRequest) {
    try {
        // Auth check - only admin can delete files
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
        }

        if (!vercelBlobDel) {
            return NextResponse.json(
                { success: false, error: '@vercel/blob not installed' },
                { status: 501 }
            );
        }

        const { url } = await request.json();

        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { success: false, error: 'URL is required' },
                { status: 400 }
            );
        }

        // Validate URL belongs to our Vercel Blob store
        if (!url.includes('vercel-storage.com') && !url.includes('blob.vercel-storage.com')) {
            return NextResponse.json(
                { success: false, error: 'Invalid storage URL' },
                { status: 400 }
            );
        }

        // Delete from Vercel Blob
        await vercelBlobDel(url);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Delete failed'
            },
            { status: 500 }
        );
    }
}
