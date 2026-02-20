import { NextRequest, NextResponse } from 'next/server';
import { getGameScoresCollection } from '@/lib/mongodb';
import { rateLimitMiddleware, checkRateLimit, getClientIP } from '@/lib/security/rateLimit';
import { sendPushNotification } from '@/lib/pushNotifications';

const GAME_ID = 'chroma_dash';

// ─── CORS helper ──────────────────────────────────────────────────────────────
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

// ─── POST /api/mobile/game/scores ─────────────────────────────────────────────
// Body: { gcPlayerId: string, displayName: string, score: number, pushToken?: string }
// Public — no auth, rate-limited. Used for "X beat you" push notifications.
export async function POST(request: NextRequest) {
    try {
        // Strict rate limit for score submissions
        const ip = getClientIP(request);
        const rl = await checkRateLimit(ip, '/api/mobile/game/scores/post', 'auth');
        if (!rl.allowed) {
            return NextResponse.json(
                { success: false, error: 'Çok fazla istek. Lütfen bekleyin.' },
                { status: 429, headers: corsHeaders() }
            );
        }

        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') {
            return NextResponse.json(
                { success: false, error: 'Geçersiz istek gövdesi' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const { gcPlayerId, displayName, score, pushToken } = body as {
            gcPlayerId?: unknown;
            displayName?: unknown;
            score?: unknown;
            pushToken?: unknown;
        };

        // Validate
        if (typeof gcPlayerId !== 'string' || !gcPlayerId.trim()) {
            return NextResponse.json(
                { success: false, error: 'gcPlayerId gerekli' },
                { status: 400, headers: corsHeaders() }
            );
        }
        if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 9999) {
            return NextResponse.json(
                { success: false, error: 'Geçersiz skor' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const playerName = typeof displayName === 'string' ? displayName.trim().slice(0, 30) : 'Anonim';
        const normalizedId = gcPlayerId.trim();
        const now = new Date();
        const col = await getGameScoresCollection();

        // Get current record for this player
        const existing = await col.findOne({ game: GAME_ID, gcPlayerId: normalizedId });
        const oldScore = existing?.score ?? 0;

        if (score <= oldScore) {
            // Score didn't improve — no notifications needed
            return NextResponse.json(
                { success: true, improved: false },
                { headers: corsHeaders() }
            );
        }

        // Upsert player's best score
        const updateData: Record<string, unknown> = {
            game: GAME_ID,
            gcPlayerId: normalizedId,
            displayName: playerName,
            score,
            updatedAt: now,
        };
        if (typeof pushToken === 'string' && pushToken.trim()) {
            updateData.pushToken = pushToken.trim();
        }

        if (!existing) {
            await col.insertOne({ ...updateData, createdAt: now } as any);
        } else {
            await col.updateOne(
                { game: GAME_ID, gcPlayerId: normalizedId },
                { $set: updateData }
            );
        }

        // ── "X seni geçti!" bildirimi ─────────────────────────────────────────
        // Find players whose score is between the player's old and new scores
        // These players were just beaten by this player
        try {
            const beatenPlayers = await col.find({
                game: GAME_ID,
                gcPlayerId: { $ne: normalizedId },
                score: { $gte: oldScore, $lt: score },
                pushToken: { $exists: true, $ne: '' },
            }).toArray();

            if (beatenPlayers.length > 0) {
                const tokens = beatenPlayers
                    .map(p => p.pushToken)
                    .filter((t): t is string => !!t);

                if (tokens.length > 0) {
                    await sendPushNotification(tokens, {
                        title: '🎮 Chroma Dash',
                        body: `${playerName} seni geçti! Yeni skor: ${score}`,
                        data: { type: 'game_beaten', game: GAME_ID },
                        sound: 'default',
                    });
                }
            }
        } catch (notifError) {
            // Non-critical — don't fail the request
            console.error('Beat notification error:', notifError);
        }

        return NextResponse.json(
            { success: true, improved: true },
            { headers: corsHeaders() }
        );
    } catch (error) {
        console.error('Game scores POST error:', error);
        return NextResponse.json(
            { success: false, error: 'Skor kaydedilemedi' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// ─── OPTIONS — CORS preflight ─────────────────────────────────────────────────
export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
