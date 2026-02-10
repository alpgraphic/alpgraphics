import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 * Requirements: min 8 chars, at least 1 number
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
        return { valid: false, message: 'Şifre en az 8 karakter olmalıdır' };
    }
    if (!/\d/.test(password)) {
        return { valid: false, message: 'Şifre en az 1 rakam içermelidir' };
    }
    return { valid: true };
}

/**
 * Generate a secure random token (cryptographically secure)
 */
export function generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Session expiry time (7 days in milliseconds)
 */
export const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Create a session expiry timestamp
 */
export function createSessionExpiry(): number {
    return Date.now() + SESSION_EXPIRY_MS;
}

/**
 * Check if session is expired
 */
export function isSessionExpired(expiryTimestamp: number): boolean {
    return Date.now() > expiryTimestamp;
}
