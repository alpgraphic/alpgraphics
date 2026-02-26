import { describe, it, expect } from 'vitest';
import {
    generateToken,
    hashPassword,
    verifyPassword,
    validatePasswordStrength,
    createSessionExpiry,
    isSessionExpired,
    SESSION_EXPIRY_MS,
} from '@/lib/auth';

describe('generateToken', () => {
    it('should generate a 64-character hex string', () => {
        const token = generateToken();
        expect(token).toHaveLength(64);
        expect(/^[a-f0-9]{64}$/.test(token)).toBe(true);
    });

    it('should generate unique tokens each call', () => {
        const t1 = generateToken();
        const t2 = generateToken();
        expect(t1).not.toBe(t2);
    });
});

describe('hashPassword / verifyPassword', () => {
    it('should hash and verify correctly', async () => {
        const password = 'TestPassword123';
        const hash = await hashPassword(password);

        expect(hash).not.toBe(password);
        expect(hash.startsWith('$2')).toBe(true); // bcrypt prefix

        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);
    });

    it('should reject wrong password', async () => {
        const hash = await hashPassword('correct123');
        const isValid = await verifyPassword('wrong456', hash);
        expect(isValid).toBe(false);
    });

    it('should produce different hashes for same password (random salt)', async () => {
        const h1 = await hashPassword('same123');
        const h2 = await hashPassword('same123');
        expect(h1).not.toBe(h2);
    });
});

describe('validatePasswordStrength', () => {
    it('should reject passwords shorter than 8 chars', () => {
        const result = validatePasswordStrength('Ab1');
        expect(result.valid).toBe(false);
        expect(result.message).toBeDefined();
    });

    it('should reject passwords without a digit', () => {
        const result = validatePasswordStrength('NodigitsHere');
        expect(result.valid).toBe(false);
    });

    it('should accept a valid password', () => {
        const result = validatePasswordStrength('ValidPass1');
        expect(result.valid).toBe(true);
        expect(result.message).toBeUndefined();
    });
});

describe('session expiry helpers', () => {
    it('SESSION_EXPIRY_MS should be 7 days', () => {
        expect(SESSION_EXPIRY_MS).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('createSessionExpiry should return future timestamp', () => {
        const expiry = createSessionExpiry();
        expect(expiry).toBeGreaterThan(Date.now());
    });

    it('isSessionExpired should return false for fresh session', () => {
        const expiry = createSessionExpiry();
        expect(isSessionExpired(expiry)).toBe(false);
    });

    it('isSessionExpired should return true for past timestamp', () => {
        const pastExpiry = Date.now() - 1000;
        expect(isSessionExpired(pastExpiry)).toBe(true);
    });
});
