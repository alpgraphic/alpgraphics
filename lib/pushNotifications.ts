/**
 * Server-side Expo Push Notification sender.
 * Calls Expo Push API — no extra npm package needed.
 */

export interface PushMessage {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    sound?: 'default' | null;
    badge?: number;
}

/**
 * Send a push notification to one or more Expo push tokens.
 * Silently ignores invalid/empty tokens.
 */
export async function sendPushNotification(
    tokens: string | string[],
    message: PushMessage
): Promise<void> {
    const tokenList = (Array.isArray(tokens) ? tokens : [tokens]).filter(Boolean);
    if (tokenList.length === 0) return;

    const messages = tokenList.map(token => ({
        to: token,
        sound: message.sound ?? 'default',
        title: message.title,
        body: message.body,
        data: message.data ?? {},
        badge: message.badge,
    }));

    try {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });
    } catch (e) {
        console.error('Push notification send error:', e);
    }
}

/**
 * Get push tokens for a specific user from the push_tokens collection.
 */
export async function getTokensForUser(userId: string): Promise<string[]> {
    try {
        const { getPushTokensCollection } = await import('@/lib/mongodb');
        const col = await getPushTokensCollection();
        const docs = await col.find({ userId }).toArray();
        return docs.map(d => d.token).filter(Boolean);
    } catch {
        return [];
    }
}

/**
 * Get all admin push tokens (for notifying admin of events).
 */
export async function getAdminTokens(): Promise<string[]> {
    try {
        const { getPushTokensCollection } = await import('@/lib/mongodb');
        const col = await getPushTokensCollection();
        const docs = await col.find({ role: 'admin' }).toArray();
        return docs.map(d => d.token).filter(Boolean);
    } catch {
        return [];
    }
}
