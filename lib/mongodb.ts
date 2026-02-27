/**
 * MongoDB Atlas Configuration
 * 
 * Setup:
 * 1. Go to https://www.mongodb.com/atlas
 * 2. Create a cluster (free tier M0)
 * 3. Create database user
 * 4. Get connection string
 * 5. Add to .env.local:
 *    MONGODB_URI=mongodb+srv://<user>:<password>@cluster.xxxxx.mongodb.net/alpgraphics
 */

import { MongoClient, Db, Collection } from 'mongodb';

// Connection
const uri = process.env.MONGODB_URI || '';
const options = {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    waitQueueTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    // In development, use a global variable to preserve connection across hot reloads
    const globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // In production, create a new client
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export { clientPromise };

// Database Types
export interface DbAccount {
    _id?: string;
    name: string;
    company: string;
    email?: string;
    username?: string; // Unique login identifier (replaces email for auth)
    passwordHash?: string;
    // password field removed - only passwordHash should be used
    twoFactorSecret?: string; // 2FA Secret Key
    role?: 'admin' | 'client'; // User role
    briefToken?: string; // Unique token for public brief form URL
    totalDebt: number;
    totalPaid: number;
    balance: number;
    status: 'Active' | 'Archived';
    briefFormType?: string;
    briefStatus: 'none' | 'pending' | 'submitted' | 'approved';
    briefResponses?: Record<string, string | string[]>;
    briefSubmittedAt?: Date;
    briefApprovedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface DbProject {
    _id?: string;
    id: number; // Frontend Timestamp ID
    title: string;
    client: string;
    accountId?: string;
    // Workflow linking
    linkedAccountId?: string | number;
    linkedProposalId?: number;
    linkedBrandPageId?: string;
    brandData?: any; // Full Brand Page Config
    pageBlocks?: any[]; // Legacy/Partial

    category: string;
    year: string;
    image?: string;
    description: string;
    status: 'Planning' | 'In Progress' | 'Review' | 'Completed' | 'On Hold';
    progress: number;
    dueDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface DbInvoice {
    _id?: string;
    accountId: string;
    client: string;
    amount: number;
    currency: 'TRY' | 'USD' | 'EUR';
    status: 'Paid' | 'Pending' | 'Overdue';
    date: Date;
    dueDate?: Date;
    items?: Array<{ description: string; amount: number }>;
    createdAt: Date;
}

export interface DbTransaction {
    _id?: string;
    accountId: string;
    type: 'Debt' | 'Payment';
    amount: number;
    description: string;
    date: Date;
    createdAt: Date;
}

export interface DbProposal {
    _id?: string;
    accountId?: string;
    title: string;
    clientName: string;
    status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
    totalAmount: number;
    currency: 'TRY' | 'USD' | 'EUR';
    validUntil: Date;
    items: Array<{
        title: string;
        description: string;
        quantity: number;
        unitPrice: number;
    }>;
    logoText?: string;
    logoSubtext?: string;
    logoUrl?: string;
    primaryColor?: string;
    currencySymbol?: string;
    taxRate?: number;
    attnText?: string;
    preparedForLabel?: string;
    projectLabel?: string;
    footerName?: string;
    footerTitle?: string;
    footerNote?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Database helper
export async function getDb(): Promise<Db> {
    const client = await clientPromise;
    return client.db('alpgraphics');
}

// Collection helpers
export async function getAccountsCollection(): Promise<Collection<DbAccount>> {
    const db = await getDb();
    return db.collection<DbAccount>('accounts');
}

export async function getProjectsCollection(): Promise<Collection<DbProject>> {
    const db = await getDb();
    return db.collection<DbProject>('projects');
}

export async function getInvoicesCollection(): Promise<Collection<DbInvoice>> {
    const db = await getDb();
    return db.collection<DbInvoice>('invoices');
}

export async function getProposalsCollection(): Promise<Collection<DbProposal>> {
    const db = await getDb();
    return db.collection<DbProposal>('proposals');
}

export async function getTransactionsCollection(): Promise<Collection<DbTransaction>> {
    const db = await getDb();
    return db.collection<DbTransaction>('transactions');
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export interface DbMessage {
    _id?: string;
    accountId: string;      // the client account ID (common thread)
    senderId: string;
    senderRole: 'admin' | 'client';
    senderName: string;
    content: string;
    createdAt: Date;
    readAt?: Date;
}

export async function getMessagesCollection(): Promise<Collection<DbMessage>> {
    const db = await getDb();
    return db.collection<DbMessage>('messages');
}

// ─── Planner Tasks ────────────────────────────────────────────────────────────
export interface DbPlannerTask {
    _id?: string;
    userId: string;
    title: string;
    notes?: string;
    date: string;           // YYYY-MM-DD — which day
    startTime?: string;     // HH:MM
    dueTime?: string;       // HH:MM — deadline for reminder
    isCompleted: boolean;
    completedAt?: Date;
    priority: 'high' | 'normal' | 'low';
    color?: string;
    isBreak: boolean;
    duration?: number;      // minutes (for break blocks)
    order: number;
    repeatDaily: boolean;
    projectTag?: string;    // optional client/project label
    estimatedMinutes?: number;
    createdAt: Date;
    updatedAt: Date;
}

export async function getPlannerTasksCollection(): Promise<Collection<DbPlannerTask>> {
    const db = await getDb();
    return db.collection<DbPlannerTask>('planner_tasks');
}

// ─── Push Tokens ──────────────────────────────────────────────────────────────
export interface DbPushToken {
    _id?: string;
    userId: string;
    role: 'admin' | 'client';
    token: string;
    platform?: string;
    updatedAt: Date;
}

export async function getPushTokensCollection(): Promise<Collection<DbPushToken>> {
    const db = await getDb();
    return db.collection<DbPushToken>('push_tokens');
}

// Session Management
export interface DbSession {
    _id?: string;
    token: string;
    userId: string;
    userEmail?: string;
    role: 'admin' | 'client';
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    expiresAt: Date;
    lastActivityAt: Date;
}

export async function getSessionsCollection(): Promise<Collection<DbSession>> {
    const db = await getDb();
    return db.collection<DbSession>('sessions');
}

// Rate Limiting
export interface DbRateLimit {
    _id?: string;
    key: string; // IP address or user ID
    endpoint: string;
    count: number;
    windowStart: Date;
    expiresAt: Date;
}

export async function getRateLimitCollection(): Promise<Collection<DbRateLimit>> {
    const db = await getDb();
    return db.collection<DbRateLimit>('rate_limits');
}

// ─── INDEX MANAGEMENT ───
let indexesCreated = false;

/**
 * Ensure all required indexes exist.
 * Called once on first connection.
 */
export async function ensureIndexes(): Promise<void> {
    if (indexesCreated) return;

    try {
        const db = await getDb();

        // Accounts: unique email, unique username (sparse), briefToken lookup
        await db.collection('accounts').createIndex({ email: 1 }, { unique: true, sparse: true });
        await db.collection('accounts').createIndex({ username: 1 }, { unique: true, sparse: true });
        await db.collection('accounts').createIndex({ briefToken: 1 }, { sparse: true });

        // Sessions: token lookup, auto-expire
        await db.collection('sessions').createIndex({ token: 1 }, { unique: true });
        await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        await db.collection('sessions').createIndex({ userId: 1 });

        // Rate Limits: lookup + auto-expire
        await db.collection('rate_limits').createIndex({ key: 1, endpoint: 1 });
        await db.collection('rate_limits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

        // Transactions: account lookup
        await db.collection('transactions').createIndex({ accountId: 1 });

        // Projects: id lookup
        await db.collection('projects').createIndex({ id: 1 }, { sparse: true });

        // Game Scores: unique GC player per game, sorted leaderboard
        await db.collection('game_scores').createIndex({ game: 1, gcPlayerId: 1 }, { unique: true });
        await db.collection('game_scores').createIndex({ game: 1, score: -1 });

        // Messages: fast conversation queries + sorted retrieval
        await db.collection('messages').createIndex({ accountId: 1, createdAt: -1 });
        await db.collection('messages').createIndex({ accountId: 1, senderRole: 1, readAt: 1 });

        // Typing status: auto-expire after TTL
        await db.collection('typing_status').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        await db.collection('typing_status').createIndex({ accountId: 1, userId: 1 }, { unique: true });

        indexesCreated = true;
    } catch (error) {
        console.error('Index creation error:', error);
    }
}

// Site Settings
export interface DbSiteSettings {
    _id?: string;
    key: 'scene'; // singleton key
    dayImage?: string; // base64 or URL
    nightImage?: string;
    dayPosition: { x: number; y: number; z: number };
    nightPosition: { x: number; y: number; z: number };
    dayWidth: { desktop: number; mobile: number };
    nightWidth: { desktop: number; mobile: number };
    imageAspect: number; // width/height ratio
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    updatedAt: Date;
}

export async function getSiteSettingsCollection(): Promise<Collection<DbSiteSettings>> {
    const db = await getDb();
    return db.collection<DbSiteSettings>('site_settings');
}

// ─── Game Scores ──────────────────────────────────────────────────────────────
export interface DbGameScore {
    _id?: string;
    game: string;   // e.g. 'chroma_dash'
    gcPlayerId: string;   // Game Center player ID, unique per game
    displayName: string;   // Game Center display name
    score: number;   // best score (upsert keeps max)
    pushToken?: string;   // Expo push token for notifications
    createdAt: Date;
    updatedAt: Date;
}

export async function getGameScoresCollection(): Promise<Collection<DbGameScore>> {
    const db = await getDb();
    return db.collection<DbGameScore>('game_scores');
}

// ─── Milestones ───────────────────────────────────────────────────────────────
export interface DbMilestoneAttachment {
    id: string;
    imageData: string;   // base64 encoded (compressed on client before upload)
    mimeType: string;
}

export interface DbMilestone {
    _id?: any;
    projectId: string;
    accountId?: string;  // linked account to push-notify (from project.linkedAccountId)
    title: string;
    description?: string;
    status: 'pending' | 'completed';
    order: number;
    attachments: DbMilestoneAttachment[];
    feedback: Record<string, 'liked' | 'disliked'>;  // attachmentId → 'liked'|'disliked'
    completedAt?: Date;
    createdAt: Date;
}

export async function getMilestonesCollection(): Promise<Collection<DbMilestone>> {
    const db = await getDb();
    return db.collection<DbMilestone>('milestones');
}

// Run index creation on module load (server-side only)
if (typeof window === 'undefined') {
    ensureIndexes().catch(console.error);
}
