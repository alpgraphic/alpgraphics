import { describe, it, expect } from 'vitest';

// Test proposal data validation logic (unit tests, no DB)
interface ProposalItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface ProposalInput {
    title: string;
    clientName: string;
    validUntil: string;
    items: ProposalItem[];
    currency: 'TRY' | 'USD' | 'EUR';
    status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
}

function validateProposal(input: Partial<ProposalInput>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.title?.trim()) errors.push('title is required');
    if (!input.clientName?.trim()) errors.push('clientName is required');
    if (!input.validUntil) errors.push('validUntil is required');
    if (!input.items?.length) errors.push('at least one item is required');
    if (!input.currency) errors.push('currency is required');

    if (input.items) {
        input.items.forEach((item, i) => {
            if (item.quantity <= 0) errors.push(`item[${i}].quantity must be positive`);
            if (item.unitPrice < 0) errors.push(`item[${i}].unitPrice must be non-negative`);
        });
    }

    return { valid: errors.length === 0, errors };
}

function calculateProposalTotal(items: ProposalItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

describe('Proposal Validation', () => {
    const validProposal: ProposalInput = {
        title: 'Website Redesign',
        clientName: 'Acme Corp',
        validUntil: '2026-04-01',
        items: [
            { description: 'UI Design', quantity: 1, unitPrice: 5000, total: 5000 },
            { description: 'Development', quantity: 40, unitPrice: 500, total: 20000 },
        ],
        currency: 'TRY',
        status: 'Draft',
    };

    it('should accept a valid proposal', () => {
        const result = validateProposal(validProposal);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should reject proposal with missing title', () => {
        const result = validateProposal({ ...validProposal, title: '' });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('title is required');
    });

    it('should reject proposal with no items', () => {
        const result = validateProposal({ ...validProposal, items: [] });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('at least one item is required');
    });

    it('should reject item with zero quantity', () => {
        const badItems = [{ description: 'X', quantity: 0, unitPrice: 100, total: 0 }];
        const result = validateProposal({ ...validProposal, items: badItems });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('item[0].quantity must be positive');
    });

    it('should reject item with negative price', () => {
        const badItems = [{ description: 'X', quantity: 1, unitPrice: -100, total: -100 }];
        const result = validateProposal({ ...validProposal, items: badItems });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('item[0].unitPrice must be non-negative');
    });

    it('should collect multiple errors', () => {
        const result = validateProposal({});
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
});

describe('Proposal Total Calculation', () => {
    it('should sum item totals correctly', () => {
        const items: ProposalItem[] = [
            { description: 'A', quantity: 2, unitPrice: 1000, total: 2000 },
            { description: 'B', quantity: 5, unitPrice: 200, total: 1000 },
        ];
        expect(calculateProposalTotal(items)).toBe(3000);
    });

    it('should return 0 for empty items', () => {
        expect(calculateProposalTotal([])).toBe(0);
    });

    it('should handle single item', () => {
        const items: ProposalItem[] = [
            { description: 'Solo', quantity: 1, unitPrice: 7500, total: 7500 },
        ];
        expect(calculateProposalTotal(items)).toBe(7500);
    });
});
